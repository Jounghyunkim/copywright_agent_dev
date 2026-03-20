# Migration 구현 결과 — Skillset Review System

> 실행일: 2026-03-20
> 기반 계획: `MIGRATION_SKILL_SET_PLAN.md`

---

## 1. 구현 완료 Phase 요약

| Phase | 내용 | 상태 |
|-------|------|------|
| **Phase 0** | PostgreSQL DB 확인 + `uuid-ossp` 확장 설치 | ✅ |
| **Phase 1** | `database.py` + `models.py` → 3개 테이블 자동 생성 | ✅ |
| **Phase 2** | 빌트인 6개 스킬 LLM 프롬프트 구현 | ✅ |
| **Phase 3** | 스킬 라우터 + 병렬 실행 (`runner.py`) | ✅ |
| **Phase 4** | Review SSE 엔드포인트 + DB 결과 저장 + 이력 조회 | ✅ |
| **Phase 5** | Custom Skill CRUD API + ID 충돌 방어 | ✅ |
| **Phase 6** | Frontend — `handleSubmitReview` SSE 연동 | ✅ |
| **Phase 7** | Frontend — API 기반 스킬 목록 (builtin/custom 배지) | ✅ |
| **Phase 8** | Frontend — Review 결과 카드 + 요약 UI | ✅ |

---

## 2. 생성된 파일

### Backend (12개 신규)

```
backend/app/
├── database.py                     ← PostgreSQL + SQLAlchemy async 연결
├── models.py                       ← ReviewSession, ReviewResult, CustomSkill ORM 모델
├── skills/
│   ├── __init__.py
│   ├── runner.py                   ← 스킬 병렬 실행 + 빌트인/커스텀 라우팅
│   ├── custom_runner.py            ← 커스텀 스킬 prompt_template 기반 실행 엔진
│   ├── catalog.py                  ← 빌트인 메타데이터 + DB 커스텀 스킬 병합
│   └── builtin/
│       ├── __init__.py             ← BUILTIN_REGISTRY 매핑 (6개 스킬)
│       ├── ai_washing.py           ← AI 관련 과장/오해 소지 표현 감지
│       ├── brand_lexicon.py        ← LG 브랜드 용어 가이드라인 준수 검증
│       ├── brief_normalizer.py     ← 브리프-카피 일관성 검증
│       ├── channel_variant.py      ← 채널별 카피 변형 생성 (SNS/배너/영상/이메일)
│       ├── cultural_sensitivity.py ← 문화적 민감성 및 현지화 적합성 검증
│       └── tone_consistency.py     ← 톤 앤 매너 일관성 유지 검증
```

### 수정된 파일 (5개)

| 파일 | 변경 내용 |
|------|----------|
| `backend/app/main.py` | lifespan DB 초기화, Review SSE 3개 + Skill CRUD 5개 엔드포인트 추가 |
| `backend/app/schemas.py` | `ReviewRequest`, `SelectedCopy`, `CustomSkillCreate/Update`, `SkillResponse` 추가 |
| `backend/requirements.txt` | `sqlalchemy[asyncio]`, `asyncpg` 추가 |
| `frontend/src/pages/Editor.jsx` | `handleSubmitReview` SSE 연동, 스킬 목록 API 로딩, 리뷰 결과 상태 관리 |
| `frontend/src/components/EditorViews.jsx` | `ReviewView` API 스킬 목록, `ReviewResultCard`, `ReviewSummaryCard` 추가 |

---

## 3. 신규 API 엔드포인트 (8개)

### Review Endpoints

| Method | Path | 기능 | 응답 |
|--------|------|------|------|
| `POST` | `/api/v1/campaigns/review` | Review 실행 | SSE 스트림 (skill_completed × N → review_done) |
| `GET` | `/api/v1/campaigns/review/history` | 프로젝트별 리뷰 이력 | `{ sessions: [...] }` |
| `GET` | `/api/v1/campaigns/review/{session_id}` | 리뷰 세션 결과 조회 | `{ id, results: [...] }` |

### Skill CRUD Endpoints

| Method | Path | 기능 | 비고 |
|--------|------|------|------|
| `GET` | `/api/v1/skills` | 전체 스킬 목록 | 빌트인 6개 + 커스텀 |
| `POST` | `/api/v1/skills` | 커스텀 스킬 등록 | 빌트인 ID 충돌 시 409 |
| `GET` | `/api/v1/skills/{skill_id}` | 스킬 상세 조회 | 커스텀은 prompt_template 포함 |
| `PUT` | `/api/v1/skills/{skill_id}` | 커스텀 스킬 수정 | 빌트인 수정 불가 (403) |
| `DELETE` | `/api/v1/skills/{skill_id}` | 커스텀 스킬 삭제 | 빌트인 삭제 불가 (403) |

### Review SSE 이벤트 시퀀스

```
→ review_started   { sessionId, skills }
→ skill_completed  { skillId, skillType, targetCopyKey, passed, score, findings, suggestions }  × N
→ review_done      { sessionId, summary: { total, passed, failed, avgScore } }
→ [DONE]
```

---

## 4. 데이터베이스

### 접속 정보

```
Host: localhost (10.158.2.63)
Port: 5432
Database: copywriting_agent_db
User: copywriting
Password: agent
Driver: asyncpg (SQLAlchemy 2.0 async)
Pool: pool_size=10, max_overflow=20
```

### 테이블 구조

**review_sessions** — 리뷰 실행 세션
- PK: `id` (UUID)
- 스냅샷: `brief_snapshot`, `analysis_snapshot`, `strategic_message_snapshot` (JSONB)
- 상태: `status` CHECK (`pending`/`running`/`completed`/`failed`/`interrupted`)
- 인덱스: `project_name`, `status`

**review_results** — 스킬별 실행 결과
- PK: `id` (UUID)
- FK: `session_id` → review_sessions (ON DELETE CASCADE)
- 결과: `passed` (bool), `score` (0-100 CHECK), `findings`/`suggestions` (JSONB)
- 디버깅: `raw_llm_response` (TEXT), `execution_ms` (INTEGER)
- 인덱스: `session_id`

**custom_skills** — 사용자 커스텀 스킬
- PK: `id` (VARCHAR, kebab-case)
- 실행: `prompt_template` (TEXT, NOT NULL)
- 분류: `category` CHECK (`validation`/`generation`/`analysis`)
- `reference_docs`, `output_schema` (JSONB, nullable)

### 테이블 자동 생성

`main.py`의 `lifespan` 핸들러에서 앱 시작 시 `Base.metadata.create_all()` 호출.
별도의 migration 스크립트 불필요 (Alembic은 스키마 변경 빈도가 높아지면 도입).

---

## 5. 빌트인 스킬 구현 상세

### 공통 패턴

모든 빌트인 스킬은 동일한 구조를 따름:
1. `SYSTEM_PROMPT` — 역할 정의 + 체크 항목 + JSON 출력 포맷 지정
2. `async def run(copy_text: str, context: dict) -> dict` — Azure OpenAI 호출
3. 출력: `{ passed, score, findings, suggestions, raw_llm_response, execution_ms }`
4. `temperature=0` (검증 스킬) 또는 `temperature=0.7` (생성 스킬)

### 스킬별 특성

| Skill ID | 카테고리 | Temp | 특수 입력 |
|---|---|---|---|
| `ai-washing-risk-check` | validation | 0 | copy_text + brief_summary |
| `brand-lexicon-check` | validation | 0 | copy_text + brief_summary |
| `campaign-brief-normalizer` | validation | 0 | copy_text + brief + strategic_message |
| `channel-variant-generator` | generation | 0.7 | copy_text + strategic_message |
| `cultural-sensitivity-check` | validation | 0 | copy_text + country_code + brief_summary |
| `tone-consistency-guard` | validation | 0 | copy_text + strategic_message |

---

## 6. 스킬 실행 아키텍처

### 병렬 실행 흐름

```
enabledSkills × selectedCopies → task 목록 생성
                                      ↓
                            asyncio.gather(*tasks)
                                      ↓
                    ┌─────── builtin? ──────── custom? ───────┐
                    ↓                                         ↓
            전용 함수 호출                          DB에서 prompt_template 로드
            (BUILTIN_REGISTRY)                    → custom_runner.run_custom_skill()
                    ↓                                         ↓
                    └──────── 통일된 결과 포맷 ────────────────┘
                                      ↓
                          review_results 테이블 INSERT
                                      ↓
                            SSE로 프론트엔드 전송
```

### 커스텀 스킬 템플릿 변수

`prompt_template`에서 `{{변수명}}` 형태로 사용:
- `{{copy_text}}` — 검토 대상 카피 전문
- `{{brief_summary}}` — 브리프 JSON
- `{{analysis_context}}` — 분석 리포트 JSON
- `{{strategic_message}}` — 전략 메시지 JSON
- `{{country_code}}` — 대상 국가 코드
- `{{language}}` — 카피 언어

---

## 7. 프론트엔드 변경 상세

### Editor.jsx 신규 상태

| 상태 | 타입 | 용도 |
|------|------|------|
| `isReviewing` | boolean | Review SSE 진행 중 여부 |
| `reviewResults` | array | 스킬별 결과 누적 (SSE `skill_completed` 이벤트) |
| `reviewSummary` | object | 리뷰 요약 (SSE `review_done` 이벤트) |
| `availableSkills` | array | API에서 로딩한 빌트인+커스텀 스킬 목록 |

### Editor.jsx 신규 로직

1. **앱 로드 시** `useEffect` → `GET /api/v1/skills` → `availableSkills` 상태 저장
2. **Submit Review** → `POST /api/v1/campaigns/review` SSE 스트림 소비
   - `skill_completed` → `setReviewResults(prev => [...prev, event])`
   - `review_done` → `setReviewSummary(event.summary)`

### EditorViews.jsx 신규 컴포넌트

**ReviewResultCard** — 개별 스킬 결과 카드
- pass/fail 색상 (초록/빨강 배경)
- skillId + score 배지 + targetCopyKey + 실행시간
- findings: severity 색상별 아이콘 (high=빨강, medium=주황, low=파랑)
- suggestions: 원본(취소선) → 제안(초록 볼드) 형태

**ReviewSummaryCard** — 리뷰 요약
- 다크 그라디언트 배경 (`#1a1a2e → #16213e`)
- 3-column 그리드: Total Checks (파랑) / Passed (초록) / Avg Score (노랑)

**ReviewView 개선**
- `availableSkills` prop → API 스킬 목록 사용 (없으면 기존 `SKILLSETS` 폴백)
- 각 스킬에 `builtin`/`custom` 타입 배지 표시
- Submit 버튼: 카피 0개 또는 스킬 0개 시 비활성화

---

## 8. 구현 중 발견/해결한 이슈

| 이슈 | 해결 |
|------|------|
| `SelectedCopy.copy` 필드가 Pydantic `BaseModel.copy()` 메서드와 충돌 | `copyData`로 필드명 변경 |
| `/review/history`가 `/review/{session_id}`에 매칭됨 | FastAPI 라우트 순서 변경 (history를 먼저 등록) |
| `asyncpg` 미설치 | `uv add asyncpg` 실행 |
| PostgreSQL DB 생성 권한 부족 (`copywriting` 유저) | 사용자가 별도로 DB 생성 (`copywriting_agent_db`) |
| DB명 불일치 (`copywrite_agent_db` vs `copywriting_agent_db`) | 실제 DB명 `copywriting_agent_db`로 통일 |

---

## 9. 검증 결과

### 백엔드 API 검증 (모두 PASS)

```
1. GET  /api/v1/skills                → 6 builtin skills
2. POST /api/v1/skills (create)       → custom skill created
3. GET  /api/v1/skills/{id}           → skill detail returned
4. PUT  /api/v1/skills/{id}           → skill updated
5. DELETE /api/v1/skills/{id}         → skill deleted
6. DELETE /api/v1/skills/{builtin}    → 403 blocked
7. GET  /api/v1/campaigns/review/history → empty sessions list
8. POST /api/v1/campaigns/review      → SSE stream (LLM 호출 필요)
```

### 프론트엔드 빌드 검증

```
✓ 1405 modules transformed
✓ built in 1.79s (에러 없음)
```

### DB 테이블 검증

```
review_sessions  — UUID PK, JSONB 스냅샷, status CHECK, 인덱스 2개
review_results   — UUID PK, FK CASCADE, score CHECK 0-100, 인덱스 1개
custom_skills    — VARCHAR PK, category CHECK, prompt_template NOT NULL
```
