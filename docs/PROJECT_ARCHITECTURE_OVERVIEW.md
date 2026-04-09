# Project Architecture Overview — AI Copywriting Platform

> Last updated: 2026-04-08

---

## 1. System Overview

AI-powered copywriting platform for LG brand campaigns. Users fill a campaign brief, which flows through a LangGraph agent pipeline to produce a Market Analyst Report, Strategic Message, culturally adapted copy, and skill-based quality reviews — all within a 5-step wizard UI.

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                       │
│   Vite dev server :5173 ──proxy──→ /api, /health                │
│                                                                  │
│   Pages: Home · NewWorkflow · Campaigns · Settings · About       │
│   State: Zustand (UI) + React Query (server) + Component-local  │
│   i18n:  EN / KO / DE                                            │
└───────────────────────────┬──────────────────────────────────────┘
                            │  REST + SSE
┌───────────────────────────▼──────────────────────────────────────┐
│                        BACKEND (FastAPI)                          │
│   Uvicorn :5000 · 28 endpoints · async                           │
│                                                                  │
│   LangGraph Pipeline ──→ Azure OpenAI + Tavily + FAISS          │
│   3-Tier Skill System ──→ 6 builtin + 57 SKILL.md + N custom   │
│   DeepAgent ──→ skill-aware copy generation + persona divergence │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                      PostgreSQL 16                                │
│   campaigns · review_sessions · review_results · custom_skills   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. 5-Step Workflow — End-to-End Data Flow

### Step 1: Research

```
User fills Brief Form + uploads Message Matrix (.xlsx)
  │
  ├─ (optional) POST /api/v1/campaigns/generate-brief
  │   → AI auto-fills 9 brief fields from project name + context
  │
  ├─ POST /api/v1/message-matrix/sheets → sheet names
  ├─ POST /api/v1/message-matrix/parse  → product USPs
  │
  └─ Submit → POST /api/v1/campaigns/analyze (SSE stream)
       │
       ├─ query_planner → 4 search queries
       ├─ web_search (Tavily) ∥ enhanced_rag (FAISS)  ← parallel
       └─ synthesizer → AnalysisReport (10 fields)
           │
           └─ autoSave(2) → POST /api/v1/campaigns/save (draft, step=2)
```

**Frontend**: BriefingForm.jsx + MessageMatrixUpload.jsx → SSE reader → AnalysisReport.jsx

---

### Step 2: Analysis

```
User reviews 10-field Market Analyst Report
  │
  ├─ Approve → triggers Step 3
  └─ Modify  → returns to Step 1
```

**Frontend**: AnalysisReport.jsx (card grid: briefSummary, persona, brandFit, marketAnalysis, competitiveKeywords, categoryNarrative, emotionalJTBD, culturalTension, copyImplications, recommendedKeywords)

---

### Step 3: Strategic Message

```
POST /api/v1/campaigns/strategic-message
  → { brief, analysisReport }
  → Returns: { coreMessage, messagePillars[], emotionalHook, toneDirection, keyPhrases[] }
  │
  └─ autoSave(3) → PUT /api/v1/campaigns/{id} (draft, step=3)

User reviews 5 cards → Approve or Modify (inline edit)
```

**Frontend**: StrategicMessage.jsx (5 editable cards)

---

### Step 4: Generation

```
User configures: countries (20), age groups (5), target personas (5), AI Writer personas (10)
  │
  ├─ Standard mode:
  │   POST /api/v1/campaigns/generate-copy
  │     → DeepAgent: _plan_skills() → _build_skill_context() → LLM → CopyResult[]
  │
  └─ Persona mode:
      POST /api/v1/campaigns/generate-copy-candidates
        → For each selected writer (2-3):
            DeepAgent.generate_copy(persona_skill=writer-metaphor-master, culture_skill=culture-japan)
        → Returns: { candidates[], selected_personas[] }
  │
  └─ autoSave(4) → PUT /api/v1/campaigns/{id} (draft, step=4)
```

**Frontend**: GenerationConfig.jsx → CopyResults.jsx (persona tabs + country accordion + inline edit)

---

### Step 5: Review

```
User selects copies + enables skills (default ON: 5 skills)
  │
  POST /api/v1/campaigns/review (SSE stream)
    → runner.py: asyncio.gather(skill × copy)
    │
    ├─ builtin skill → Python function (BUILTIN_REGISTRY)
    ├─ skillmd skill → SKILL.md body → LLM prompt (skillmd_runner.py)
    └─ custom skill  → template render → LLM prompt (custom_runner.py)
    │
    → Streams: skill_completed events { skillId, targetCopyKey, score, passed, strengths[], weaknesses[], improvements[] }
    → Final: review_done { summary: { total, passed, failed, avgScore } }
  │
  ├─ (optional) POST /api/v1/campaigns/correct → LLM rewrites copy based on improvements
  └─ autoSave(5) → PUT /api/v1/campaigns/{id} (completed, step=5)
```

**Frontend**: EditorViews.jsx (ReviewView: skill toggles + ReviewResultsView: score tree)

**Default ON skills**: `regulatory-copy-validation`, `brand-lexicon-check`, `copy-scorecard-generator`, `compliance-redflag-detector`, `lg-brand-fit-check`

---

## 3. Frontend ↔ Backend API Contract

### Core Workflow

| Step | Frontend Component | API Call | Backend Handler |
|------|-------------------|----------|-----------------|
| 1 | BriefingForm | `POST /analyze` (SSE) | graph.py LangGraph DAG |
| 1 | BriefingForm | `POST /generate-brief` | LLM brief generation |
| 1 | MessageMatrixUpload | `POST /message-matrix/parse` | Excel parser |
| 3 | StrategicMessage | `POST /strategic-message` | LLM extraction |
| 4 | GenerationConfig | `POST /generate-copy` | DeepAgent + skills |
| 4 | GenerationConfig | `POST /generate-copy-candidates` | DeepAgent × personas |
| 5 | ReviewView | `POST /review` (SSE) | Parallel skill runner |
| 5 | ReviewResultsView | `POST /correct` | LLM copy correction |
| * | NewWorkflowPage | `POST /save` or `PUT /{id}` | Campaign CRUD |
| * | Chat input | `POST /chat` | Step-aware LLM chat |

### Data Catalog

| Frontend Component | API Call | Backend Source |
|-------------------|----------|---------------|
| GenerationConfig | `GET /personas` | creative_personas.py → SKILL.md writer-* |
| GenerationConfig | `GET /culture-profiles` | loader.py → SKILL.md culture-* |
| ReviewView | `GET /skills` | catalog.py → 3-tier merge |
| HomePage | `GET /dashboard` | Campaign table aggregate |
| WorkflowDetail | `GET /campaigns/{id}` | Campaign table row |
| SettingsPage | `GET/POST/PUT/DELETE /skills/*` | CustomSkill table |

### SSE Event Types

| Endpoint | Event Type | Payload |
|----------|-----------|---------|
| `/analyze` | `progress` | `{ message }` |
| `/analyze` | `result` | `{ data: AnalysisReport }` |
| `/review` | `skill_completed` | `{ skillId, targetCopyKey, score, passed, strengths[], weaknesses[], improvements[] }` |
| `/review` | `review_done` | `{ summary: { total, passed, failed, avgScore } }` |

---

## 4. Campaign Persistence & Resume

### Auto-Save Flow

```
Step 2 complete → autoSave(2) → POST /save   → { id, status: "draft", currentStep: 2 }
Step 3 complete → autoSave(3) → PUT /{id}     → { status: "draft", currentStep: 3 }
Step 4 complete → autoSave(4) → PUT /{id}     → { status: "draft", currentStep: 4 }
Step 5 complete → autoSave(5) → PUT /{id}     → { status: "completed", currentStep: 5 }
```

- First save creates new campaign (POST), subsequent saves update (PUT)
- `savedCampaignId` tracked via `useRef` for stale closure safety
- All state data passed via `overrides` to avoid async state issues

### Resume Flow

```
Home/Campaigns → click campaign card
  → /workflows/:id → WorkflowDetailPage
  → GET /api/v1/campaigns/{id} → { currentStep, brief, analysisReport, ... }
  → NewWorkflowPage({ campaignId, campaignData })
  → useEffect restores:
      - Data: brief, analysis, strategic, copies, candidates, reviews
      - UI: step=currentStep, collapsed sections, timeline
      - Flags: isApproved, isStrategicApproved (based on step)
```

### Dashboard Display

| Status | Badge | Meaning |
|--------|-------|---------|
| `draft` | `Step N/5` (warning) | In-progress, resumable |
| `completed` | `Completed` (info) | All 5 steps done |

---

## 5. Skill System Architecture

```
┌─────────────────────────────────────────────────────┐
│              Skill Catalog (catalog.py)              │
│         get_all_skills() → 61+ unified list         │
│                                                     │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ Builtin(6) │  │ SKILL.md(57)│  │ Custom(N)    │ │
│  │ Python fn  │  │ YAML+MD     │  │ Template     │ │
│  └─────┬──────┘  └──────┬──────┘  └──────┬───────┘ │
│        │                │                │          │
│  BUILTIN_REGISTRY  skillmd_runner   custom_runner   │
│  (direct call)    (body→LLM)       (template→LLM)  │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│           Routing Policy (routing_policy.py)         │
│                                                     │
│  Must-have (always ON):                             │
│    brand-lexicon-check                              │
│    compliance-redflag-detector                      │
│    lg-brand-fit-check                               │
│                                                     │
│  Conditional triggers:                              │
│    "AI" → ai-washing-risk-check                     │
│    "환경/eco" → environmental-claim-risk-check       │
│    "비교/vs" → comparative-ad-risk-check             │
│                                                     │
│  Generation: market code → culture profile          │
│    JP → culture-japan, US → culture-usa, etc.       │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│           DeepAgent (deep_agent.py)                  │
│                                                     │
│  _plan_skills()          LLM selects skills         │
│  _build_skill_context()  Loads SKILL.md bodies      │
│  generate_copy()         Injects into LLM prompt    │
│  generate_copy_with_personas()                      │
│    → select_personas_for_campaign()                 │
│    → asyncio.gather(persona1, persona2, persona3)   │
│    → Returns candidates[]                           │
└─────────────────────────────────────────────────────┘
```

---

## 6. Internationalization

| Locale | Coverage |
|--------|----------|
| 🇺🇸 English (en) | Full |
| 🇰🇷 한국어 (ko) | Full |
| 🇩🇪 Deutsch (de) | Full |

**Implementation**: Zustand `locale` state → `useT()` hook → `locales.ts` (160+ keys)
**Persistence**: `localStorage('app-locale')`
**Setting**: Settings > General > Language selector

**Coverage**: Navigation, workflow steps, briefing form placeholders, generation config, review labels, chat placeholders, status messages, buttons, error messages

---

## 7. Dependencies

### Backend
```
fastapi · uvicorn · sqlalchemy[asyncio] · asyncpg · pydantic
langchain · langchain-openai · langchain-community · langgraph
openai · tavily-python · faiss-cpu · tiktoken
python-dotenv · python-multipart · openpyxl · pyyaml
```

### Frontend
```
react · react-dom · react-router-dom
@tanstack/react-query · zustand
lucide-react · react-markdown · remark-gfm
typescript · vite · @vitejs/plugin-react
```

---

## 8. Environment & Configuration

### Backend (.env)
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

### Frontend (vite.config.ts)
```typescript
server.proxy:
  '/api'    → http://localhost:5000
  '/health' → http://localhost:5000
  '/events' → http://localhost:5000
```

### Running
```bash
# Backend
cd backend && uvicorn app.main:app --reload --port 5000

# Frontend
cd frontend && npm run dev

# Build
cd frontend && npm run build
```
