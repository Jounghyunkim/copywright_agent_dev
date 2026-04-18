# Review 심각도 — Pass / Fail 판정 및 Severity 분류 기준

카피라이트 검토 기능에서 각 리뷰 결과가 **Pass / Fail**과 **Critical / Warning / Suggestion** 심각도로 어떻게 라벨링되는지에 대한 정리 문서.

---

## 1. 핵심 원리 — 숫자 임계값이 아니라, 각 스킬이 스스로 판단

시스템에는 "N점 이상이면 Pass" 같은 전역 임계값이 **없다**. 각 리뷰 결과의 `passed: true/false`는 LLM이 해당 스킬의 지침에 따라 **독립적으로 판정**한다.

**실행 흐름**

스킬 실행 엔진(`backend/app/skills/skillmd_runner.py`)이 각 스킬의 `SKILL.md`를 시스템 프롬프트에 주입한 뒤, LLM에게 아래 JSON 형식을 요구한다.

```json
{
  "passed": true/false,
  "score": 0-100,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvements": ["..."]
}
```

`passed`와 `score`는 **서로 독립**이다. score 90이어도 `passed=false`가 나올 수 있고, 반대도 가능하다. 스킬마다 판정 근거가 다르다.

---

## 2. 스킬 유형별 Pass / Fail 판정 방식

| 스킬 유형 | Pass / Fail 판정 기준 |
|---|---|
| **Risk & Compliance** (`compliance-redflag-detector`, `ai-washing-risk-check`, `environmental-claim-risk-check`, `comparative-ad-risk-check`, `claim-extractor`, `proof-point-checker`, `regulatory-copy-validation`) | 명시적 규칙: `critical` 또는 `high` severity 위반이 **1건이라도 있으면 Fail**. 이 경우 score와 무관하게 Fail. (현재 `compliance-redflag-detector` SKILL.md에만 명문화되어 있음) |
| **Brand Integrity** (`lg-brand-fit-check`, `lg-brand-voice`, `brand-lexicon-check`, `tone-and-voice-enforcer`, `writer-solmi-check`) | 5축 × 20점 = 100점 루브릭. LLM이 총점과 질적 판단을 종합해 `passed`를 결정. 보통 **70점 안팎이 경계**이지만 스킬별로 상이. |
| **Craft Quality** (`creative-impact-scorer`, `copy-scorecard-generator`, `main-message-clarifier`, `customer-segment-fit-check` 등) | 점수 기반이되 Pass 임계값은 스킬별 프롬프트에 명시. 명시가 없으면 LLM 재량. |
| **Localization** (`culture-*`, `regional-*`, `language-transcreation`) | 문화·언어 위반 사항의 존재 여부로 LLM이 판정. |

---

## 3. 세션 집계 (Summary)

세션 종료 시 `backend/app/main.py:845-853`에서 단순 카운트가 수행된다.

```python
passed = sum(1 for r in results_collected if r["passed"])
failed = total - passed
avg_score = round(sum(r["score"] for r in results_collected) / total, 1)
```

프론트 `ReviewResults` 상단에 표시되는 Pass / Fail 개수는 **스킬 실행 건수 기준의 단순 합산**이다. "전체 리뷰가 통과했다"는 세션 레벨 Pass 판정은 현재 존재하지 않는다.

---

## 4. Severity 분류 — Pass/Fail + Score + 레인 결합

심각도 라벨은 `backend/app/main.py:586`의 `_classify_review_severity(skill_id, passed, score)` 함수가 부여한다. 규칙은 **위에서 아래로 평가**되고 처음 매치되는 규칙이 적용된다.

| 순서 | 조건 | Severity |
|---|---|---|
| 1 | `score < 50` | **critical** |
| 2 | Risk 스킬 + `passed=false` | **critical** |
| 3 | `passed=false` (비-Risk) | **warning** |
| 4 | Risk 스킬 + `score < 80` | **warning** |
| 5 | Brand 스킬 + `score < 70` | **warning** |
| 6 | 그 외 | **suggestion** |

### Severity 시각 매핑 (프론트)

| Severity | 색상 | UI 표시 |
|---|---|---|
| critical | `#dc2626` (LG 진빨강 계열) | 상단 Critical 카운트 칩, 카드 좌측 3px 액센트 |
| warning | `#d97706` (주황) | Warning 카운트 칩, 카드 좌측 3px 액센트 |
| suggestion | `#0369a1` (차분한 블루) | Suggestion 뱃지, 카드 좌측 3px 액센트 |

즉, **Pass / Fail만으로는 심각도를 알 수 없다.** 점수와 레인(스킬 유형)이 결합되어야 비로소 "이 지적이 얼마나 중요한가"가 정해진다.

### 레인 분류 (severity 판정용)

- **Risk 스킬 ID 셋**: `ai-washing-risk-check`, `compliance-redflag-detector`, `environmental-claim-risk-check`, `comparative-ad-risk-check`, `claim-extractor`, `proof-point-checker`, `regulatory-copy-validation`
- **Brand 스킬 ID 셋**: `lg-brand-fit-check`, `lg-brand-voice`, `brand-lexicon-check`, `tone-and-voice-enforcer`, `writer-solmi-check`
- 나머지 스킬은 Craft 또는 Localization으로 취급 — severity 규칙 3, 6만 적용

---

## 5. 예시 시나리오

| 시나리오 | passed | score | 스킬 유형 | Severity |
|---|---|---|---|---|
| `compliance-redflag-detector`에서 critical 위반 탐지 | `false` | 40 | Risk | **critical** (규칙 1) |
| `ai-washing-risk-check`에서 경미한 주장 발견 | `true` | 75 | Risk | **warning** (규칙 4) |
| `lg-brand-fit-check`에서 브랜드 톤 미흡 | `true` | 65 | Brand | **warning** (규칙 5) |
| `creative-impact-scorer`에서 임팩트 부족 | `false` | 55 | Craft | **warning** (규칙 3) |
| `writer-solmi-check`에서 문체 양호 | `true` | 88 | Brand | **suggestion** (규칙 6) |
| `regional-culture-fit-check`에서 무난 | `true` | 82 | Localization | **suggestion** (규칙 6) |

---

## 6. 한 문장으로 정리

> **Pass / Fail은 각 스킬이 자기 기준(SKILL.md 루브릭)으로 LLM에 위임**하며, 전역 점수 임계값은 없다. 다만 Risk 레인과 Brand 렉시콘처럼 **규칙이 명시된 스킬**엔 판정 규칙이 내장되어 있다. 화면의 Pass 수 / Fail 수는 그 개별 판정을 단순 합산한 결과이고, Severity는 (Pass/Fail, Score, 레인)의 조합으로 사후 분류된다.

---

## 7. 운영 관점 개선 제언

1. **Risk 스킬 SKILL.md 판정 규칙 명문화**
   - 현재 `compliance-redflag-detector`만 "critical·high 1건이라도 있으면 Fail"을 명시.
   - 다른 Risk 스킬(ai-washing, environmental, comparative, regulatory 등)도 동일 수준의 명시적 결정 트리를 SKILL.md에 추가하면 판정 안정성·재현성이 올라간다.

2. **Brand 스킬 공통 임계값 정의**
   - "100점 루브릭에서 ≥ 70 = Pass" 같은 **표준 임계값을 Brand 스킬 SKILL.md에 공통 명시**하면 LLM 간 판정 편차가 줄어든다.
   - 현재는 스킬별 LLM 재량에 맡겨져 있어 같은 카피라도 실행마다 `passed` 결과가 흔들릴 수 있다.

3. **Publish Gate(게시 차단) 도입 검토**
   - Phase 3 로드맵의 "Critical 1건이라도 있으면 승인 차단" 기능과 연결해, severity=critical이 세션에 존재하면 UI에서 최종 승인 버튼을 비활성화하는 방향.

4. **Severity를 LLM 자체 판정으로 승격**
   - 현재 severity는 post-hoc 휴리스틱. 향후 SKILL.md에서 finding 단위로 severity를 LLM이 직접 부여하도록 전환하면 더 정교한 분류가 가능.

---

## 8. 관련 코드 위치

| 역할 | 경로 |
|---|---|
| 스킬 실행 엔진 (LLM 호출 + passed/score 파싱) | `backend/app/skills/skillmd_runner.py` |
| Severity 분류 함수 | `backend/app/main.py:586` (`_classify_review_severity`) |
| SSE 이벤트 송신 (severity 포함) | `backend/app/main.py:770-785` |
| 세션 조회 응답 (severity 재계산) | `backend/app/main.py:863-877` |
| 세션 요약 집계 (passed/failed 카운트) | `backend/app/main.py:845-853` |
| Risk/Brand 스킬 ID 셋 정의 | `backend/app/main.py:569-585` |
| 프론트 Severity 타입 | `frontend-v2/src/shared/api/types.ts` (`ReviewSeverity`) |
| 프론트 Severity 뱃지·카드 렌더 | `frontend-v2/src/features/review/review-results.tsx` |
| 프론트 레인 분류 (UI 그룹핑) | `frontend-v2/src/features/review/lanes.ts` |
