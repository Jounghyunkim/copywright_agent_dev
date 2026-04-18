# 429 Error 개선 내용

카피라이트 검토 과정에서 발생하던 Azure OpenAI `429 Too Many Requests` 오류를 해소하기 위해 적용한 레이트 리밋 보호 계층 구현 정리.

---

## 1. 배경

### 발생 증상
```
스킬 실행 오류: Error code: 429 - {'error': {'message': 'Too Many Requests',
'type': 'too_many_requests', 'param': None, 'code': 'too_many_requests'}}
```

사용자가 스킬 여러 개 × 카피 여러 개를 한 번의 리뷰로 돌릴 때(예: Brand Deep 프리셋 5개 × 카피 5개 = 25개 LLM 호출) Azure OpenAI의 분당 요청 수(RPM) / 분당 토큰 수(TPM) 한도를 즉시 초과해 실패.

### 근본 원인
| 구분 | 개선 전 | 문제 |
|---|---|---|
| 동시성 제어 | 없음 (`asyncio.gather`로 무제한 병렬) | TPM/RPM 즉시 초과 |
| 재시도 | 없음 (`runner.py`의 `try/except`가 에러를 바로 결과로 대체) | 일시적 429도 영구 실패로 기록 |
| 백오프 | 없음 | 회복 시간 확보 불가 |
| 사용자 UX | "스킬 실행 오류" 메시지만 출력 | 진행 상황·대기 여부 불투명 |

---

## 2. 개선 전략 요약

**Phase 1 — 즉시 적용** (이번 작업 범위):
1. **동시성 세마포어** — 한 시점 최대 N개 호출로 제한
2. **지수 백오프 + 지터 재시도** — 429 / 503 / timeout 자동 복구
3. **SSE 재시도 이벤트** — 사용자에게 실시간 진행 표시
4. **환경변수 튜닝** — 배포 환경별 조정 가능

**Phase 2 이후** (후속 과제, 본 문서 범위 외):
- 토큰 풋프린트 다이어트, 적응적 배치 스로틀링, 세션 내 캐시, Circuit Breaker, 분산 작업 큐, 관측성 대시보드

---

## 3. 구현 아키텍처

### 3.1 공통 호출 래퍼 — `backend/app/skills/rate_limit.py` (신규)

```python
_llm_semaphore: Optional[asyncio.Semaphore] = None  # 프로세스 전역

async def invoke_llm(llm, messages, skill_id=""):
    """Azure OpenAI LLM 호출을 동시성 캡·재시도로 보호."""
    max_attempts = int(os.getenv("LLM_RETRY_MAX_ATTEMPTS", "4"))
    for attempt in range(1, max_attempts + 1):
        try:
            async with _get_semaphore():
                return await llm.ainvoke(messages)
        except Exception as exc:
            if attempt >= max_attempts or not _is_retryable(exc):
                raise
            wait = _compute_wait(attempt)  # 2^(n-1) × base × (0.7~1.3)
            await _emit_retry_event(skill_id, attempt, max_attempts, wait, ...)
        await asyncio.sleep(wait)          # 세마포어 밖에서 대기
```

핵심 설계 포인트:
- **세마포어는 재시도 sleep 동안 해제** — 대기 중인 다른 호출이 먼저 진행 가능
- **429 판정은 문자열 매칭** — Azure/OpenAI SDK 버전별 예외 타입 차이에 강건
- **`ContextVar`로 재시도 이벤트 콜백 관리** — 동일 프로세스 내 여러 리뷰 세션이 있어도 서로 간섭하지 않음

### 3.2 재시도 대상 분류

| 재시도 | 포함 마커 |
|---|---|
| **Rate limit** (`reason=rate_limit`) | `429`, `too_many_requests`, `rate_limit`, `ratelimit` |
| **Transient** (`reason=transient_error`) | `503`, `502`, `timeout`, `timed out`, `service_unavailable`, `bad gateway`, `connection reset`, `temporarily unavailable` |
| 재시도 제외 | 401, 400, JSON 파싱 오류 등 결정론적 실패는 즉시 전파 |

### 3.3 백오프 공식

```
wait(n) = min(LLM_RETRY_MAX_SECONDS, LLM_RETRY_BASE_SECONDS × 2^(n-1))
         × random(0.7 ~ 1.3)    # ±30% 지터
```

기본값 기준:
| 시도 # | 기본 대기 | 지터 반영 실제 |
|---|---|---|
| 1 | 1.0s | 0.7 ~ 1.3s |
| 2 | 2.0s | 1.4 ~ 2.6s |
| 3 | 4.0s | 2.8 ~ 5.2s |
| 4 | 8.0s | 5.6 ~ 10.4s |

상한은 `LLM_RETRY_MAX_SECONDS=30.0`로 클램프.

---

## 4. 변경 파일 상세

### 신규
- **`backend/app/skills/rate_limit.py`** — 본 문서 §3의 공용 래퍼

### 수정
- **`backend/app/skills/skillmd_runner.py`**
  - `await llm.ainvoke(messages)` → `await invoke_llm(llm, messages, skill_id=skill_name)`
- **`backend/app/skills/custom_runner.py`**
  - `await llm.ainvoke(messages)` → `await invoke_llm(llm, messages, skill_id="custom")`
- **`backend/app/main.py`** — 리뷰 SSE event_stream 확장
  - 요청 시작 시 `set_retry_event_callback(_retry_cb)` 등록 → 재시도 이벤트가 `result_queue`에 `{_event: "retry", ...}` 형태로 흘러들어옴
  - 드레인 루프가 retry 이벤트와 최종 결과를 구분 처리
  - `finally` 블록에서 콜백 해제 (요청 간 오염 방지)
- **`frontend-v2/src/shared/api/hooks/use-review.ts`**
  - `skill_retrying` 타입 이벤트 처리 추가
  - 진행 로그에 `⏳ {skillId} Rate limit — {N}s 대기 후 재시도 ({a}/{m})` 형태로 표시
  - `skill_completed` 이벤트에 `severity` 필드 수신 추가
- **`backend/.env` / `backend/.env.template`** — 4개 환경변수 신설

---

## 5. 환경변수

| 변수 | 기본값 | 역할 |
|---|---|---|
| `LLM_MAX_CONCURRENCY` | `4` | 한 시점 최대 동시 LLM 호출 수 |
| `LLM_RETRY_MAX_ATTEMPTS` | `4` | 첫 시도 포함 총 시도 횟수 |
| `LLM_RETRY_BASE_SECONDS` | `1.0` | 초기 백오프 (초) |
| `LLM_RETRY_MAX_SECONDS` | `30.0` | 백오프 상한 (초) |

### 운영 튜닝 가이드
- **쿼터 여유 있음** → `LLM_MAX_CONCURRENCY=6~8` 상향, 처리 속도 향상
- **429 지속 발생** → `LLM_MAX_CONCURRENCY=2~3` 하향, 안정성 우선
- **서비스 초기** → 기본값 유지, `[rate_limit] ... retry N/M` 로그 빈도로 후속 튜닝

---

## 6. SSE 이벤트 확장

### 신규 이벤트 — `skill_retrying`

```json
{
  "type": "skill_retrying",
  "skillId": "lg-brand-fit-check",
  "attempt": 2,
  "maxAttempts": 4,
  "waitSeconds": 2.3,
  "reason": "rate_limit"
}
```

- 재시도 카운트는 `total_tasks`에 포함되지 않음 — 드레인 루프의 완료 집계에 영향 없음
- 프론트 진행 로그에 즉시 반영되어 사용자는 "쉬었다 다시 시도 중" 상태를 인지 가능

### 기존 이벤트 보강 — `skill_completed`
`severity` 필드가 포함되어 프론트의 Critical/Warning/Suggestion 뱃지와 좌측 액센트 컬러가 실시간으로 렌더.

---

## 7. 동작 흐름

```
┌────────────────────────────────────────────┐
│ 사용자가 리뷰 시작                           │
└────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│ main.py event_stream                       │
│ ├ set_retry_event_callback 등록            │
│ └ 스킬×카피 조합을 비동기 태스크로 예약     │
└────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│ rate_limit.invoke_llm                      │
│ ┌ 세마포어 acquire (LLM_MAX_CONCURRENCY)   │
│ ├ llm.ainvoke(messages) 시도                │
│ │   ├ 성공 → 결과 반환                      │
│ │   └ 429/503/timeout                       │
│ │      ├ _is_retryable 판정                 │
│ │      ├ 백오프 계산 (2^(n-1) × base × 지터) │
│ │      ├ _emit_retry_event → SSE 큐         │
│ │      ├ 세마포어 release                   │
│ │      └ asyncio.sleep → 다음 시도          │
│ └ 최대 시도 초과 시 원본 예외 전파          │
└────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│ SSE 드레인 루프                              │
│ ├ {_event: "retry"}  → skill_retrying SSE  │
│ └ 스킬 결과          → skill_completed SSE │
└────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│ 프론트 use-review.ts                         │
│ ├ skill_retrying  → 진행 로그에 ⏳ 표시    │
│ └ skill_completed → 결과 카드 렌더          │
└────────────────────────────────────────────┘
```

---

## 8. 검증 결과

`backend/app/skills/rate_limit.py`를 다음 단위 테스트로 검증:

```python
# 429 에러를 2번 반환하다 3번째에 성공하는 Fake LLM
class FakeLLM:
    async def ainvoke(self, messages):
        call_count['n'] += 1
        if call_count['n'] < 3:
            raise Exception('Error code: 429 - {"error": {...}}')
        return 'OK'
```

**결과**:
```
[rate_limit] test-skill retry 1/3 after 0.1s (rate_limit): Error code: 429 ...
[rate_limit] test-skill retry 2/3 after 0.2s (rate_limit): Error code: 429 ...
result=OK, total_calls=3
retry events: 2
   skill_retrying 1 / 3 wait 0.1
   skill_retrying 2 / 3 wait 0.2
```

- 429 에러 자동 복구 ✓
- 재시도 이벤트 콜백 정상 호출 ✓
- 최종 결과 반환 ✓

---

## 9. 한계 및 후속 과제 (Phase 2 이후)

### 현 구현의 한계
- **토큰 예산 관리 없음** — 큰 컨텍스트(analysisReport 등)가 포함되면 TPM 한도를 RPM보다 먼저 소진
- **응답 헤더 기반 적응 제어 없음** — `x-ratelimit-remaining-tokens` 활용 미구현
- **Circuit Breaker 미구현** — 고장 상태의 Azure 엔드포인트에 계속 시도
- **세션 내 캐시 미구현** — 동일 입력에도 매번 재호출

### 후속 권장 작업
| 우선순위 | 항목 | 기대 효과 |
|---|---|---|
| 상 | 스킬별 `context_needs` 도입한 토큰 다이어트 | 전체 처리량 2~3배 |
| 상 | 세션 내 `(skill_id, copy_hash)` 캐시 | 재평가 대폭 가속 |
| 중 | Azure 응답 헤더 기반 적응적 배치 | 한도 근접 구간에서 자동 속도 감소 |
| 중 | Circuit Breaker (연속 429 50% 이상 → 30초 차단) | 장애 격리 |
| 하 | Celery/RQ 기반 분산 실행 | 벌크 업로드 대응 |
| 하 | Prometheus 지표·관리자 대시보드 | 관측성 |

---

## 10. 관련 코드 위치

| 역할 | 경로 |
|---|---|
| 공용 LLM 호출 래퍼 | `backend/app/skills/rate_limit.py` |
| 재시도 콜백 허브 (ContextVar) | `backend/app/skills/rate_limit.py::set_retry_event_callback` |
| SKILL.md 스킬 LLM 호출 | `backend/app/skills/skillmd_runner.py` |
| 커스텀 스킬 LLM 호출 | `backend/app/skills/custom_runner.py` |
| 리뷰 SSE 스트림 | `backend/app/main.py::run_review endpoint` |
| 프론트 SSE 구독 | `frontend-v2/src/shared/api/hooks/use-review.ts::useRunReviewSSE` |
| 환경변수 정의 | `backend/.env`, `backend/.env.template` |
