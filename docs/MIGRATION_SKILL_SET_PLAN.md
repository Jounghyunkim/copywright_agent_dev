# Migration 검토 결과: `workflow_enabler_skill` → `backend/`

## 1. 현재 상태 요약

| 영역 | 현 상태 |
|------|---------|
| **Frontend (Review Step 5)** | UI 완성 — 6개 Skillset 토글, Copy 선택 체크박스, "Submit Review" 버튼 존재 |
| **Frontend handleSubmitReview** | `console.log`만 있음 — **백엔드 연동 미구현** |
| **Backend `/api/v1/campaigns/generate-copy`** | 프롬프트에 skillset 이름을 텍스트로 포함시키는 수준 (실제 개별 스킬 실행 아님) |
| **workflow_enabler_skill** | 5개 Claude Code Skill 패키지 (템플릿 + 아키텍처 문서, 총 17파일) |

---

## 2. `workflow_enabler_skill`에서 가져올 핵심 패턴 3가지

### A. HITL Approval Service (`approval_service.py.template`)
- **역할**: Review 단계에서 사용자가 approve/edit/reject 결정 → 백엔드가 다음 처리를 라우팅
- **현재 백엔드에 없는 것**: Approval 개념 자체가 없음. `handleSubmitReview`가 호출할 엔드포인트 부재
- **Migration 방안**: `POST /api/v1/campaigns/review` 엔드포인트 신설, 선택된 copies + enabled skills를 받아 각 스킬을 순차/병렬 실행

### B. Skill Routing Policy (`routing_policy.py.template`)
- **역할**: 활성화된 스킬 목록에서 실행 순서/우선순위 결정, 카테고리 커버리지 보장
- **현재 백엔드에 없는 것**: 6개 skillset이 프론트엔드 상수(`SKILLSETS`)로만 존재, 백엔드에서 개별 스킬 로직 없음
- **Migration 방안**: 각 skillset을 독립적인 검증 함수로 구현하고, routing policy로 실행 조합 결정

### C. SSE Event Streaming (`events_router.py.template`)
- **역할**: Review 진행 상황을 실시간으로 프론트엔드에 전달
- **현재 백엔드에 있는 것**: `/analyze` 엔드포인트에 이미 SSE 스트리밍 패턴 존재 (graph 실행 진행률)
- **Migration 방안**: 기존 SSE 패턴을 Review 엔드포인트에도 적용 (스킬별 실행 진행률 전달)

---

## 3. 마이그레이션 대상 vs 불필요 항목

| workflow_enabler_skill 항목 | 필요 여부 | 사유 |
|---|---|---|
| `approval_service.py.template` 패턴 | **필요** | Review submit → 스킬 실행 → 결과 반환 흐름 구현 필요 |
| `routing_policy.py.template` 패턴 | **필요** | 6개 빌트인 + 사용자 커스텀 스킬 선택적 실행 로직 필요 |
| `events_router.py.template` 패턴 | **부분 필요** | 기존 SSE 패턴 재활용 가능, DB 이벤트 테이블은 Review 결과 저장용으로 활용 |
| `init-backend/` (전체 scaffolding) | **불필요** | 이미 FastAPI 백엔드 존재 |
| `init-frontend/` (전체 scaffolding) | **불필요** | 이미 React 프론트엔드 존재 |
| `init-skills-system/` (SKILL.md 파서) | **부분 필요** | 파일 기반 디스커버리는 불필요하나, 커스텀 스킬 등록/파싱 패턴 참고 |
| `add-workflow-step/` 스크립트 | **불필요** | 워크플로우 단계가 이미 확정 (5단계) |
| DB Models (WorkRequest, Artifact 등) | **부분 필요** | Review 결과 저장 + 커스텀 스킬 관리용 DB 모델 도입 |

---

## 4. 구체적 Migration 방안

### Step 1: 백엔드 — DB 인프라 구축

#### 1-1. PostgreSQL + SQLAlchemy (async) 도입

개발 서버(`10.158.2.63`)에 **PostgreSQL 16.13**이 설치·구동 중이므로 이를 그대로 활용한다.
SQLite 대비 **동시 write 지원**, **네이티브 JSONB**, **UUID 타입**, **ENUM 타입** 등 이점을 얻는다.

```
# 인프라 현황
- Host: localhost (10.158.2.63)
- Port: 5432
- PostgreSQL: 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
- Status: accepting connections
```

**DB 및 사용자 초기 설정** (1회성):
```sql
-- psql -U postgres
CREATE USER copywriting WITH PASSWORD 'agent';
CREATE DATABASE copywriting_agent_db OWNER copywriting;
GRANT ALL PRIVILEGES ON DATABASE copywriting_agent_db TO copywriting;

-- 확장 모듈 (UUID 생성용)
\c copywriting_agent_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**SQLAlchemy async 연결**:
```python
# backend/app/database.py
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://copywriting:agent@localhost:5432/copywriting_agent_db"
)

engine = create_async_engine(DATABASE_URL, pool_size=10, max_overflow=20)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

# FastAPI lifespan에서 호출
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

**`.env` 추가 항목**:
```env
# Database (PostgreSQL)
DATABASE_URL=postgresql+asyncpg://copywriting:agent@localhost:5432/copywriting_agent_db
```

#### 1-2. DB 테이블 설계 (3개 테이블)

**테이블 A: `review_sessions` — Review 실행 세션**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK, default `uuid_generate_v4()`) | 리뷰 세션 고유 ID |
| `project_name` | VARCHAR(255) | 캠페인 프로젝트명 |
| `brief_snapshot` | JSONB | 실행 시점의 brief 전체 스냅샷 |
| `analysis_snapshot` | JSONB | 실행 시점의 analysisReport 스냅샷 |
| `strategic_message_snapshot` | JSONB | 실행 시점의 strategicMessage 스냅샷 |
| `selected_copies` | JSONB | 검토 대상 카피 목록 (countryCode + index + content) |
| `enabled_skills` | JSONB | 활성화된 스킬 ID 배열 (빌트인 + 커스텀 혼합) |
| `status` | VARCHAR(20) CHECK | `pending` / `running` / `completed` / `failed` / `interrupted` |
| `created_at` | TIMESTAMPTZ (default `now()`) | 생성 시각 |
| `completed_at` | TIMESTAMPTZ | 완료 시각 (nullable) |

인덱스: `CREATE INDEX idx_review_sessions_project ON review_sessions(project_name);`
인덱스: `CREATE INDEX idx_review_sessions_status ON review_sessions(status);`

**테이블 B: `review_results` — 스킬별 실행 결과**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK, default `uuid_generate_v4()`) | 결과 고유 ID |
| `session_id` | UUID (FK → review_sessions ON DELETE CASCADE) | 소속 리뷰 세션 |
| `skill_id` | VARCHAR(100) | 실행된 스킬 ID |
| `skill_type` | VARCHAR(20) CHECK | `builtin` / `custom` |
| `target_copy_key` | VARCHAR(50) | 검토 대상 카피 키 (e.g. `US-0`) |
| `passed` | BOOLEAN | 통과 여부 |
| `score` | SMALLINT CHECK (0-100) | 점수 |
| `findings` | JSONB | 발견 사항 배열 `[{severity, message, location}]` |
| `suggestions` | JSONB | 개선 제안 배열 `[{original, suggested, reason}]` |
| `raw_llm_response` | TEXT | LLM 원본 응답 (디버깅/감사용) |
| `execution_ms` | INTEGER | 실행 소요 시간 (ms) |
| `created_at` | TIMESTAMPTZ (default `now()`) | 생성 시각 |

인덱스: `CREATE INDEX idx_review_results_session ON review_results(session_id);`

**테이블 C: `custom_skills` — 사용자 커스텀 스킬 정의**

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(100) (PK) | 스킬 ID (kebab-case, e.g. `legal-compliance-check`) |
| `label` | VARCHAR(200) | 표시 이름 (e.g. `Legal Compliance Check`) |
| `description` | TEXT | 스킬 설명 (한국어) |
| `category` | VARCHAR(20) CHECK | `validation` / `generation` / `analysis` |
| `prompt_template` | TEXT NOT NULL | LLM 시스템 프롬프트 템플릿 |
| `reference_docs` | JSONB | 참조 문서 경로 배열 (RAG용, nullable) |
| `output_schema` | JSONB | 예상 출력 JSON 스키마 (nullable) |
| `is_active` | BOOLEAN (default `true`) | 활성화 여부 |
| `created_at` | TIMESTAMPTZ (default `now()`) | 생성 시각 |
| `updated_at` | TIMESTAMPTZ (default `now()`) | 수정 시각 |

> **PostgreSQL 활용 포인트**:
> - **JSONB** (JSON이 아닌 JSONB): 바이너리 저장, GIN 인덱스로 JSON 내부 필드 검색 가능 (`findings @> '[{"severity":"high"}]'`)
> - **UUID 네이티브 타입**: `uuid-ossp` 확장으로 DB 레벨에서 UUID 생성, 애플리케이션 의존도 제거
> - **TIMESTAMPTZ**: 타임존 포함 타임스탬프, 다중 리전 확장 시 안전
> - **CHECK 제약**: status, category, score 범위를 DB 레벨에서 보장
> - **ON DELETE CASCADE**: 세션 삭제 시 결과 자동 정리
> - **동시 write 지원**: `asyncio.gather()` 병렬 스킬 실행 후 개별 INSERT 가능 (SQLite의 write lock 문제 해소)

### Step 2: 백엔드 — Custom Skill CRUD API

```
GET    /api/v1/skills              — 전체 스킬 목록 (빌트인 6개 + 커스텀)
POST   /api/v1/skills              — 커스텀 스킬 등록
GET    /api/v1/skills/{skill_id}   — 단일 스킬 상세 조회
PUT    /api/v1/skills/{skill_id}   — 커스텀 스킬 수정
DELETE /api/v1/skills/{skill_id}   — 커스텀 스킬 삭제 (빌트인 삭제 불가)
```

#### 빌트인 vs 커스텀 스킬 구분

| 구분 | 빌트인 (6개) | 커스텀 |
|------|-------------|--------|
| 저장 위치 | 코드 내 하드코딩 (`skills/builtin/`) | DB `custom_skills` 테이블 |
| 삭제 가능 | No | Yes |
| 프롬프트 수정 | 코드 배포 필요 | API로 즉시 수정 |
| 실행 방식 | 전용 함수 (RAG 등 특수 로직 포함 가능) | 공통 러너가 `prompt_template` 기반 실행 |
| 카탈로그 응답 | `{ ...skill, type: 'builtin', editable: false }` | `{ ...skill, type: 'custom', editable: true }` |

#### 커스텀 스킬 등록 시 입력 필드

```json
{
  "id": "legal-compliance-check",
  "label": "Legal Compliance Check",
  "description": "법적 규제 준수 여부 검증",
  "category": "validation",
  "prompt_template": "You are a legal compliance reviewer for advertising copy.\n\nGiven the following copy text, check for:\n1. Misleading claims\n2. Missing disclaimers\n3. Regulatory violations\n\nCopy: {{copy_text}}\nBrief Context: {{brief_summary}}\n\nRespond in JSON: {passed, score, findings[], suggestions[]}",
  "reference_docs": ["data/legal_guidelines.txt"],
  "output_schema": null
}
```

`prompt_template`에서 사용 가능한 변수:
- `{{copy_text}}` — 검토 대상 카피 전문
- `{{brief_summary}}` — 브리프 요약
- `{{analysis_context}}` — 분석 리포트 핵심 내용
- `{{strategic_message}}` — 전략 메시지
- `{{country_code}}` — 대상 국가 코드
- `{{language}}` — 카피 언어

### Step 3: 백엔드 — Review 엔드포인트 추가 (`main.py`)

```
POST /api/v1/campaigns/review
```
- **Input**: `selectedCopies` (검토 대상 카피 목록) + `enabledSkills` (활성화된 스킬 ID 목록, 빌트인+커스텀 혼합) + `brief` + `analysisReport` + `strategicMessage` + `copyResults`
- **Output**: SSE 스트림 (스킬별 진행률 + 최종 리뷰 결과)
- **DB 저장**: `review_sessions` 생성 → 스킬별 `review_results` 저장 → 세션 `completed`로 업데이트

```
GET /api/v1/campaigns/review/{session_id}           — 리뷰 세션 결과 조회
GET /api/v1/campaigns/review/history?project_name=X  — 프로젝트별 리뷰 이력 조회
```

### Step 4: 백엔드 — 스킬 실행 로직 구현

6개 빌트인 스킬 각각을 **LLM 프롬프트 기반 검증 함수**로 구현:

| Skill ID | 구현 방식 |
|---|---|
| `ai-washing-risk-check` | 카피 텍스트에서 AI 관련 과장 표현 탐지 (프롬프트) |
| `brand-lexicon-check` | LG 브랜드 용어 가이드라인 대조 (RAG + 프롬프트) |
| `campaign-brief-normalizer` | 브리프 항목과 카피 일관성 검증 (프롬프트) |
| `channel-variant-generator` | 채널별 카피 변형 생성 (프롬프트) |
| `cultural-sensitivity-check` | 문화적 민감성 검증 (프롬프트) |
| `tone-consistency-guard` | 톤앤매너 일관성 검증 (프롬프트) |

커스텀 스킬은 **공통 러너**가 DB의 `prompt_template`을 로드하여 동일한 출력 포맷으로 실행.

모든 스킬(빌트인/커스텀)은 통일된 결과 포맷을 반환:
```json
{
  "skill_id": "ai-washing-risk-check",
  "skill_type": "builtin",
  "passed": false,
  "score": 35,
  "findings": [
    { "severity": "high", "message": "'AI가 알아서 해결' — 과장 표현", "location": "headline" }
  ],
  "suggestions": [
    { "original": "AI가 알아서 해결합니다", "suggested": "AI 기술을 활용하여 도움을 드립니다", "reason": "과장 소지 완화" }
  ],
  "execution_ms": 1230
}
```

### Step 5: 백엔드 — 스킬 라우팅

`routing_policy.py.template` 패턴 참고하되 단순화:
- 프론트엔드에서 전달된 `enabledSkills` 목록에서 빌트인/커스텀 자동 분류
- 빌트인 → 전용 함수 호출, 커스텀 → 공통 러너 + DB prompt_template
- `asyncio.gather()`로 병렬 실행 (각 스킬이 독립적)
- 실행 순서 의존성이 있는 경우만 순차 처리
- 각 스킬 결과를 `review_results` 테이블에 저장

### Step 6: 프론트엔드 — `handleSubmitReview` 연동

- `POST /api/v1/campaigns/review` SSE 호출
- 스킬별 진행률 표시 (기존 analyze 단계의 SSE 패턴 재활용)
- 결과를 ReviewView에 표시 (pass/fail, findings, suggestions)

### Step 7: 프론트엔드 — Custom Skill 관리 UI

- Review Settings 내 "USE SKILLSETS" 섹션에 "+ Add Custom Skill" 버튼 추가
- 커스텀 스킬 등록 모달: label, description, category, prompt_template 입력
- 스킬 목록에서 빌트인은 잠금 아이콘, 커스텀은 편집/삭제 버튼 표시
- `GET /api/v1/skills` 호출하여 빌트인+커스텀 통합 목록 표시

### Step 8: 프론트엔드 — Review 이력 조회 UI

- Review 완료 후 결과 요약 카드 표시 (전체 pass/fail 수, 평균 score)
- 과거 리뷰 이력 리스트 (프로젝트별 필터링)
- 이전 리뷰 결과와 비교하여 개선/퇴보 지표 표시

---

## 5. 아키텍처 관점 결정 사항

| 결정 포인트 | 권장안 | 이유 |
|---|---|---|
| **DB 도입** | **Yes — PostgreSQL 16.13 + SQLAlchemy (async)** | 개발 서버에 이미 설치·구동 중. 동시 write 지원으로 `asyncio.gather()` 병렬 INSERT 가능, 네이티브 JSONB/UUID 타입으로 스키마 설계 단순화 |
| **DB 접속 정보** | `localhost:5432 / copywriting_agent_db` | `.env`에 `DATABASE_URL` 추가, 기존 Azure OpenAI 키와 함께 관리 |
| **비동기 드라이버** | `asyncpg` | FastAPI async 패턴과 호환, SQLAlchemy 2.0 공식 지원, connection pool 내장 |
| **Migration 도구** | Alembic (선택적) | 초기에는 `Base.metadata.create_all()` 자동 생성, 스키마 변경이 잦아지면 Alembic 도입 |
| **빌트인 스킬 관리** | 코드 하드코딩 (`skills/builtin/`) | 6개 빌트인 스킬은 전용 로직(RAG 등)이 필요하므로 코드로 관리 |
| **커스텀 스킬 관리** | DB `custom_skills` 테이블 | 사용자가 API/UI로 동적 등록·수정·삭제, `prompt_template` 기반 공통 러너로 실행 |
| **별도 서비스 분리 vs main.py에 추가** | `main.py`에 엔드포인트 추가 + 스킬/DB 로직은 별도 모듈 | 엔드포인트는 `main.py`, 스킬 구현은 `skills/`, DB는 `database.py` + `models.py` |
| **LangGraph 통합 vs 독립 실행** | 독립 실행 (`asyncio.gather`) | Review 스킬은 graph 의존성 없는 단순 검증 |
| **새 Python 의존성** | `asyncpg`, `sqlalchemy[asyncio]` | 비동기 PostgreSQL 드라이버 + SQLAlchemy async 지원 |
| **Connection Pool** | `pool_size=10, max_overflow=20` | 동시 스킬 실행(최대 6+α개 병렬) 대응, FastAPI 동시 요청 처리 |

---

## 6. 예상 파일 변경

```
backend/app/
├── main.py              ← Review + Skill CRUD 엔드포인트 추가
├── schemas.py           ← ReviewRequest, ReviewResponse, SkillResult,
│                           CustomSkillCreate, CustomSkillUpdate 모델 추가
├── database.py          ← 새 파일: SQLAlchemy async engine + session
├── models.py            ← 새 파일: ReviewSession, ReviewResult, CustomSkill ORM 모델
├── skills/              ← 새 디렉토리
│   ├── __init__.py
│   ├── runner.py        ← 스킬 병렬 실행 + 라우팅 (빌트인/커스텀 분류)
│   ├── custom_runner.py ← 커스텀 스킬 공통 실행 엔진 (prompt_template 기반)
│   ├── builtin/         ← 빌트인 스킬 전용 디렉토리
│   │   ├── __init__.py
│   │   ├── ai_washing.py
│   │   ├── brand_lexicon.py
│   │   ├── brief_normalizer.py
│   │   ├── channel_variant.py
│   │   ├── cultural_sensitivity.py
│   │   └── tone_consistency.py
│   └── catalog.py       ← 빌트인 스킬 카탈로그 (메타데이터 + DB 커스텀 병합)

backend/data/
├── faiss_index/         ← 기존 유지
└── knowledge_base.txt   ← 기존 유지

(PostgreSQL DB는 localhost:5432/copywriting_agent_db — 파일시스템 외부)

frontend/src/
├── pages/Editor.jsx     ← handleSubmitReview에 API 호출 + SSE 연동
├── components/
│   ├── EditorViews.jsx  ← ReviewView에 결과 표시 UI + 리뷰 이력 추가
│   ├── GenerationConfig.jsx ← SKILLSETS 상수 → API 기반 동적 로딩으로 변경
│   ├── CustomSkillModal.jsx ← 새 파일: 커스텀 스킬 등록/편집 모달
│   └── ReviewHistory.jsx   ← 새 파일: 과거 리뷰 이력 조회 컴포넌트
```

---

## 7. 데이터 흐름도

### Review 실행 흐름

```
[Frontend]                        [Backend]                     [PostgreSQL]
    │                                 │                                 │
    │  POST /api/v1/campaigns/review  │                                 │
    │  (copies + skills + context)    │                                 │
    │────────────────────────────────►│                                 │
    │                                 │  INSERT review_sessions          │
    │                                 │────────────────────────────────►│
    │                                 │                                 │
    │  SSE: skill_started             │  분류: builtin vs custom         │
    │◄────────────────────────────────│                                 │
    │                                 │  asyncio.gather()               │
    │                                 │  ├─ builtin: 전용 함수 실행      │
    │                                 │  └─ custom: DB prompt → 공통러너  │
    │                                 │  (PG 동시 write 지원 — 병렬 INSERT 가능)
    │                                 │                                 │
    │  SSE: skill_completed (per skill)│  INSERT review_results (per)    │
    │◄────────────────────────────────│────────────────────────────────►│
    │                                 │                                 │
    │  SSE: review_done (summary)     │  UPDATE session → completed     │
    │◄────────────────────────────────│────────────────────────────────►│
```

### Custom Skill 등록 흐름

```
[Frontend]                        [Backend]                     [PostgreSQL]
    │                                 │                                 │
    │  POST /api/v1/skills            │                                 │
    │  { id, label, prompt_template } │                                 │
    │────────────────────────────────►│                                 │
    │                                 │  Validate id uniqueness          │
    │                                 │  (빌트인 ID 충돌 체크 포함)       │
    │                                 │  Validate prompt_template vars   │
    │                                 │  INSERT custom_skills            │
    │                                 │────────────────────────────────►│
    │                                 │                                 │
    │  200 OK { skill }               │                                 │
    │◄────────────────────────────────│                                 │
    │                                 │                                 │
    │  GET /api/v1/skills             │                                 │
    │────────────────────────────────►│  builtin 카탈로그 + DB custom    │
    │                                 │  병합하여 반환                    │
    │  200 OK [builtin × 6 + custom]  │                                 │
    │◄────────────────────────────────│                                 │
```

---

## 8. 구현 우선순위

| 순서 | 작업 | 의존성 | 예상 규모 |
|------|------|--------|----------|
| **Phase 0** | PostgreSQL DB/사용자 생성 + `uuid-ossp` 확장 설치 (1회성) | 없음 | 소 |
| **Phase 1** | DB 인프라 (`database.py`, `models.py`) + `asyncpg` 연결 + 테이블 자동생성 | Phase 0 | 소 |
| **Phase 2** | 빌트인 6개 스킬 구현 (`skills/builtin/`) | 없음 | **대** (프롬프트 설계 핵심) |
| **Phase 3** | 스킬 라우터 + 병렬 실행 (`skills/runner.py`) | Phase 2 | 중 |
| **Phase 4** | Review 엔드포인트 + SSE + 결과 저장 | Phase 1, 3 | 중 |
| **Phase 5** | Custom Skill CRUD API (`main.py` + `custom_runner.py`) | Phase 1 | 중 |
| **Phase 6** | Frontend — Review 연동 + 결과 표시 | Phase 4 | 중 |
| **Phase 7** | Frontend — Custom Skill 등록 UI + 스킬 목록 동적 로딩 | Phase 5 | 중 |
| **Phase 8** | Frontend — Review 이력 조회 UI | Phase 4 | 소 |

---

## 9. 요약

`workflow_enabler_skill`은 **범용 워크플로우 서비스 생성 도구**이므로 전체를 가져오는 것은 과도합니다. 핵심적으로 필요한 것은 **3가지 패턴**(Approval 흐름, Skill Routing, SSE 진행률)이며, 여기에 **PostgreSQL 16.13** (localhost 설치 완료)을 활용하여 다음 두 가지를 추가합니다:

1. **Review 결과 영속 저장** — 리뷰 세션과 스킬별 결과를 DB에 저장하여 이력 조회, 비교 분석 가능
2. **사용자 Custom Skillset** — `prompt_template` 기반으로 사용자가 직접 검증 스킬을 등록·수정·삭제, 빌트인 6개와 동일한 실행 파이프라인에서 작동

PostgreSQL 도입으로 이전 리뷰에서 지적된 **SQLite 병렬 write 잠금 문제가 해소**되며, 네이티브 JSONB를 활용한 JSON 내부 필드 검색(리뷰 결과 필터링 등)이 가능해집니다. 가장 큰 작업은 **Phase 2 (빌트인 6개 스킬의 LLM 프롬프트 설계)** 이며, DB 인프라(Phase 0~1)는 기존 PostgreSQL 인스턴스를 활용하므로 빠르게 완료 가능합니다.
