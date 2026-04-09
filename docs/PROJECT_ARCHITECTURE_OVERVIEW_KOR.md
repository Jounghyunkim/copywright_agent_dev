# 프로젝트 아키텍처 개요 — AI 카피라이팅 플랫폼

> 최종 업데이트: 2026-04-08

---

## 1. 시스템 개요

LG 브랜드 캠페인을 위한 AI 기반 카피라이팅 플랫폼입니다. 사용자가 캠페인 브리프를 작성하면 LangGraph 에이전트 파이프라인을 통해 시장 분석 리포트, 전략 메시지, 문화 맞춤형 카피, 스킬 기반 품질 리뷰까지 — 5단계 위자드 UI 안에서 모두 처리합니다.

```
┌──────────────────────────────────────────────────────────────────┐
│                     프론트엔드 (React 19)                         │
│   Vite 개발 서버 :5173 ──프록시──→ /api, /health                  │
│                                                                  │
│   페이지: 홈 · 새 워크플로우 · 캠페인 목록 · 설정 · 소개           │
│   상태관리: Zustand (UI) + React Query (서버) + 컴포넌트 로컬      │
│   다국어: EN / KO / DE                                            │
└───────────────────────────┬──────────────────────────────────────┘
                            │  REST + SSE
┌───────────────────────────▼──────────────────────────────────────┐
│                       백엔드 (FastAPI)                             │
│   Uvicorn :5000 · 28개 엔드포인트 · 비동기                        │
│                                                                  │
│   LangGraph 파이프라인 ──→ Azure OpenAI + Tavily + FAISS          │
│   3계층 스킬 시스템 ──→ 빌트인 6개 + SKILL.md 57개 + 커스텀 N개   │
│   DeepAgent ──→ 스킬 기반 카피 생성 + 페르소나 경쟁 생성           │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                      PostgreSQL 16                                │
│   campaigns · review_sessions · review_results · custom_skills   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. 5단계 워크플로우 — 전체 데이터 흐름

### Step 1: 리서치

```
사용자가 브리프 폼 작성 + Message Matrix (.xlsx) 업로드
  │
  ├─ (선택) POST /api/v1/campaigns/generate-brief
  │   → AI가 프로젝트명 + 컨텍스트로 나머지 9개 브리프 필드 자동 생성
  │
  ├─ POST /api/v1/message-matrix/sheets → 시트명 목록
  ├─ POST /api/v1/message-matrix/parse  → 제품 USP 추출
  │
  └─ Submit → POST /api/v1/campaigns/analyze (SSE 스트리밍)
       │
       ├─ query_planner → 검색 쿼리 4개 생성
       ├─ web_search (Tavily) ∥ enhanced_rag (FAISS)  ← 병렬 실행
       └─ synthesizer → AnalysisReport (10개 필드)
           │
           └─ autoSave(2) → POST /api/v1/campaigns/save (draft, step=2)
```

**프론트엔드**: BriefingForm.jsx + MessageMatrixUpload.jsx → SSE 리더 → AnalysisReport.jsx

---

### Step 2: 분석

```
사용자가 10개 필드의 Market Analyst Report 검토
  │
  ├─ 승인 → Step 3 진행
  └─ 수정 → Step 1로 복귀
```

**프론트엔드**: AnalysisReport.jsx (카드 그리드: briefSummary, persona, brandFit, marketAnalysis, competitiveKeywords, categoryNarrative, emotionalJTBD, culturalTension, copyImplications, recommendedKeywords)

---

### Step 3: 전략 메시지

```
POST /api/v1/campaigns/strategic-message
  → { brief, analysisReport }
  → 반환: { coreMessage, messagePillars[], emotionalHook, toneDirection, keyPhrases[] }
  │
  └─ autoSave(3) → PUT /api/v1/campaigns/{id} (draft, step=3)

사용자가 5개 카드 검토 → 승인 또는 수정 (인라인 편집)
```

**프론트엔드**: StrategicMessage.jsx (5개 편집 가능 카드)

---

### Step 4: 카피 생성

```
사용자가 설정: 국가 (20개), 연령대 (5개), 타겟 페르소나 (5개), AI Writer 페르소나 (10개)
  │
  ├─ 표준 모드:
  │   POST /api/v1/campaigns/generate-copy
  │     → DeepAgent: _plan_skills() → _build_skill_context() → LLM → CopyResult[]
  │
  └─ 페르소나 모드:
      POST /api/v1/campaigns/generate-copy-candidates
        → 선택된 Writer별 (2~3명):
            DeepAgent.generate_copy(persona_skill=writer-metaphor-master, culture_skill=culture-japan)
        → 반환: { candidates[], selected_personas[] }
  │
  └─ autoSave(4) → PUT /api/v1/campaigns/{id} (draft, step=4)
```

**프론트엔드**: GenerationConfig.jsx → CopyResults.jsx (페르소나 탭 + 국가별 아코디언 + 인라인 편집)

---

### Step 5: 리뷰

```
사용자가 카피 선택 + 스킬 활성화 (기본 ON: 5개 스킬)
  │
  POST /api/v1/campaigns/review (SSE 스트리밍)
    → runner.py: asyncio.gather(스킬 × 카피)
    │
    ├─ 빌트인 스킬 → Python 함수 (BUILTIN_REGISTRY)
    ├─ SKILL.md 스킬 → SKILL.md 본문 → LLM 프롬프트 (skillmd_runner.py)
    └─ 커스텀 스킬 → 템플릿 렌더링 → LLM 프롬프트 (custom_runner.py)
    │
    → 스트리밍: skill_completed 이벤트 { skillId, targetCopyKey, score, passed, strengths[], weaknesses[], improvements[] }
    → 완료: review_done { summary: { total, passed, failed, avgScore } }
  │
  ├─ (선택) POST /api/v1/campaigns/correct → LLM이 개선사항 기반으로 카피 교정
  └─ autoSave(5) → PUT /api/v1/campaigns/{id} (completed, step=5)
```

**프론트엔드**: EditorViews.jsx (ReviewView: 스킬 토글 + ReviewResultsView: 점수 트리)

**기본 ON 스킬**: `regulatory-copy-validation`, `brand-lexicon-check`, `copy-scorecard-generator`, `compliance-redflag-detector`, `lg-brand-fit-check`

---

## 3. 프론트엔드 ↔ 백엔드 API 연동

### 핵심 워크플로우

| 단계 | 프론트엔드 컴포넌트 | API 호출 | 백엔드 핸들러 |
|------|-------------------|----------|--------------|
| 1 | BriefingForm | `POST /analyze` (SSE) | graph.py LangGraph DAG |
| 1 | BriefingForm | `POST /generate-brief` | LLM 브리프 생성 |
| 1 | MessageMatrixUpload | `POST /message-matrix/parse` | Excel 파서 |
| 3 | StrategicMessage | `POST /strategic-message` | LLM 추출 |
| 4 | GenerationConfig | `POST /generate-copy` | DeepAgent + 스킬 |
| 4 | GenerationConfig | `POST /generate-copy-candidates` | DeepAgent × 페르소나 |
| 5 | ReviewView | `POST /review` (SSE) | 병렬 스킬 실행기 |
| 5 | ReviewResultsView | `POST /correct` | LLM 카피 교정 |
| * | NewWorkflowPage | `POST /save` 또는 `PUT /{id}` | 캠페인 CRUD |
| * | 채팅 입력 | `POST /chat` | 단계별 LLM 채팅 |

### 데이터 카탈로그

| 프론트엔드 컴포넌트 | API 호출 | 백엔드 소스 |
|-------------------|----------|------------|
| GenerationConfig | `GET /personas` | creative_personas.py → SKILL.md writer-* |
| GenerationConfig | `GET /culture-profiles` | loader.py → SKILL.md culture-* |
| ReviewView | `GET /skills` | catalog.py → 3계층 병합 |
| HomePage | `GET /dashboard` | Campaign 테이블 집계 |
| WorkflowDetail | `GET /campaigns/{id}` | Campaign 테이블 행 |
| SettingsPage | `GET/POST/PUT/DELETE /skills/*` | CustomSkill 테이블 |

### SSE 이벤트 타입

| 엔드포인트 | 이벤트 타입 | 페이로드 |
|----------|-----------|---------|
| `/analyze` | `progress` | `{ message }` |
| `/analyze` | `result` | `{ data: AnalysisReport }` |
| `/review` | `skill_completed` | `{ skillId, targetCopyKey, score, passed, strengths[], weaknesses[], improvements[] }` |
| `/review` | `review_done` | `{ summary: { total, passed, failed, avgScore } }` |

---

## 4. 캠페인 저장 및 이어하기

### 자동 저장 흐름

```
Step 2 완료 → autoSave(2) → POST /save   → { id, status: "draft", currentStep: 2 }
Step 3 완료 → autoSave(3) → PUT /{id}     → { status: "draft", currentStep: 3 }
Step 4 완료 → autoSave(4) → PUT /{id}     → { status: "draft", currentStep: 4 }
Step 5 완료 → autoSave(5) → PUT /{id}     → { status: "completed", currentStep: 5 }
```

- 첫 저장은 신규 캠페인 생성 (POST), 이후 저장은 업데이트 (PUT)
- `savedCampaignId`를 `useRef`로 추적하여 stale closure 문제 방지
- 모든 state 데이터는 `overrides`로 직접 전달하여 비동기 상태 이슈 해결

### 이어하기 흐름

```
홈/캠페인 목록 → 캠페인 카드 클릭
  → /workflows/:id → WorkflowDetailPage
  → GET /api/v1/campaigns/{id} → { currentStep, brief, analysisReport, ... }
  → NewWorkflowPage({ campaignId, campaignData })
  → useEffect로 복원:
      - 데이터: brief, analysis, strategic, copies, candidates, reviews
      - UI: step=currentStep, 접힌 섹션, 타임라인
      - 플래그: isApproved, isStrategicApproved (단계 기반)
```

### 대시보드 표시

| 상태 | 배지 | 의미 |
|------|------|------|
| `draft` | `Step N/5` (경고) | 진행 중, 이어하기 가능 |
| `completed` | `Completed` (정보) | 5단계 모두 완료 |

---

## 5. 스킬 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│            스킬 카탈로그 (catalog.py)                  │
│       get_all_skills() → 61개 이상 통합 목록           │
│                                                     │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ 빌트인 (6) │  │ SKILL.md(57)│  │ 커스텀 (N)   │ │
│  │ Python 함수│  │ YAML+MD     │  │ 템플릿       │ │
│  └─────┬──────┘  └──────┬──────┘  └──────┬───────┘ │
│        │                │                │          │
│  BUILTIN_REGISTRY  skillmd_runner   custom_runner   │
│  (직접 호출)      (본문→LLM)       (템플릿→LLM)     │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│          라우팅 정책 (routing_policy.py)               │
│                                                     │
│  필수 스킬 (항상 ON):                                 │
│    brand-lexicon-check                              │
│    compliance-redflag-detector                      │
│    lg-brand-fit-check                               │
│                                                     │
│  조건부 트리거:                                       │
│    "AI" → ai-washing-risk-check                     │
│    "환경/eco" → environmental-claim-risk-check       │
│    "비교/vs" → comparative-ad-risk-check             │
│                                                     │
│  생성 스킬: 시장 코드 → 문화 프로필                    │
│    JP → culture-japan, US → culture-usa 등           │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│           DeepAgent (deep_agent.py)                  │
│                                                     │
│  _plan_skills()          LLM이 스킬 선택             │
│  _build_skill_context()  SKILL.md 본문 로딩           │
│  generate_copy()         LLM 프롬프트에 주입           │
│  generate_copy_with_personas()                      │
│    → select_personas_for_campaign()                 │
│    → asyncio.gather(페르소나1, 페르소나2, 페르소나3)    │
│    → 후보 candidates[] 반환                          │
└─────────────────────────────────────────────────────┘
```

---

## 6. 다국어 지원

| 언어 | 적용 범위 |
|------|----------|
| 🇺🇸 English (en) | 전체 |
| 🇰🇷 한국어 (ko) | 전체 |
| 🇩🇪 Deutsch (de) | 전체 |

**구현**: Zustand `locale` 상태 → `useT()` 훅 → `locales.ts` (160개 이상 키)
**영속화**: `localStorage('app-locale')`
**설정**: Settings > General > Language 선택기

**적용 범위**: 네비게이션, 워크플로우 단계, 브리프 폼 플레이스홀더, 생성 설정, 리뷰 라벨, 채팅 플레이스홀더, 상태 메시지, 버튼, 오류 메시지

---

## 7. 의존성

### 백엔드
```
fastapi · uvicorn · sqlalchemy[asyncio] · asyncpg · pydantic
langchain · langchain-openai · langchain-community · langgraph
openai · tavily-python · faiss-cpu · tiktoken
python-dotenv · python-multipart · openpyxl · pyyaml
```

### 프론트엔드
```
react · react-dom · react-router-dom
@tanstack/react-query · zustand
lucide-react · react-markdown · remark-gfm
typescript · vite · @vitejs/plugin-react
```

---

## 8. 환경 설정

### 백엔드 (.env)
```
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_DEPLOYMENT=...
AZURE_OPENAI_API_VERSION=...
EMBEDDING_DEPLOYMENT=...
EMBEDDING_ENDPOINT=...
TAVILY_API_KEY=...
DATABASE_URL=postgresql+asyncpg://copywriting:agent@localhost:5432/copywriting_agent_db
```

### 프론트엔드 (vite.config.ts)
```typescript
server.proxy:
  '/api'    → http://localhost:5000
  '/health' → http://localhost:5000
  '/events' → http://localhost:5000
```

### 실행 방법
```bash
# 백엔드
cd backend && uvicorn app.main:app --reload --port 5000

# 프론트엔드
cd frontend && npm run dev

# 프로덕션 빌드
cd frontend && npm run build
```
