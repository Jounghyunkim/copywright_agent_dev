# Copywrite Agent

LG전자 브랜드 캠페인을 위한 AI 기반 카피라이팅 플랫폼입니다.
캠페인 브리프를 입력하면 LangGraph 에이전트 파이프라인(웹 검색 + RAG + LLM 합성)을 통해
10개 항목의 Market Analyst Report를 생성하고, Human-in-the-Loop 기반의 5단계 워크플로우로 최종 카피를 완성합니다.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React 18 + Vite)           port 5173             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │ Dashboard │ │   New    │ │ Workflow │ │   Settings     │ │
│  │  (Home)   │ │ Campaign │ │   List   │ │ Skill Authoring│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘ │
│         │            │             │              │          │
│         └────────────┴─────────────┴──────────────┘          │
│                     Vite Proxy (/api → :5000)                │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│  Backend (FastAPI + LangGraph)        port 5000             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  LangGraph Pipeline                                  │    │
│  │  query_planner → [web_search ∥ enhanced_rag]         │    │
│  │                       → synthesizer → END            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────┐  ┌───────────┐  ┌─────────────────────┐  │
│  │ Azure OpenAI │  │  Tavily   │  │  FAISS Vector Store │  │
│  │ (Chat + Emb) │  │ (Search)  │  │  (Knowledge Base)   │  │
│  └──────────────┘  └───────────┘  └─────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Skill Engine (Review)                               │    │
│  │  builtin/ (6 skills)  +  custom/ (.md files)         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────┐                                       │
│  │  PostgreSQL       │                                       │
│  │  (Sessions, Logs) │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflow (5 Steps)

| Step | Name | Actor | Description |
|------|------|-------|-------------|
| 1 | **Briefing** | Human | 9개 섹션의 캠페인 브리프 작성 (AI 자동생성 지원) |
| 2 | **Analysis** | AI | LangGraph 파이프라인으로 Market Analyst Report 생성 |
| 3 | **Strategic Message** | Human + AI | 감성/행동 기반 전략 메시지 추출 및 승인 |
| 4 | **Generation** | Human + AI | 국가/페르소나별 카피 변형 생성 |
| 5 | **Review** | Human + AI | Builtin + Custom Skill 기반 품질 검증 |

### Market Analyst Report (10 Fields)

`briefSummary` · `persona` · `brandFit` (0-100) · `marketAnalysis` · `competitiveKeywords` · `categoryNarrative` (old→new) · `emotionalJTBD` · `culturalTension` · `copyImplications` (do/don't) · `recommendedKeywords`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, React Router, TanStack Query, Zustand |
| Backend | FastAPI, LangGraph, LangChain |
| LLM | Azure OpenAI (GPT-4 Chat + Embeddings) |
| Search | Tavily API |
| Vector Store | FAISS (local) |
| Database | PostgreSQL + SQLAlchemy 2.0 (async) |
| Package Manager | uv (Python 3.14), npm (Node) |

---

## Project Structure

```
copywriting_agent_dev/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 엔드포인트 (20+)
│   │   ├── graph.py             # LangGraph StateGraph 파이프라인
│   │   ├── schemas.py           # Pydantic 요청/응답 모델
│   │   ├── models.py            # SQLAlchemy ORM 모델
│   │   ├── database.py          # PostgreSQL async 연결
│   │   ├── skills/
│   │   │   ├── catalog.py       # Builtin + Custom 스킬 통합 카탈로그
│   │   │   ├── runner.py        # 스킬 병렬 실행 엔진
│   │   │   ├── custom_runner.py # Custom 스킬 LLM 실행기
│   │   │   ├── builtin/         # 6개 빌트인 스킬 (Python)
│   │   │   │   ├── ai_washing.py
│   │   │   │   ├── brand_lexicon.py
│   │   │   │   ├── brief_normalizer.py
│   │   │   │   ├── channel_variant.py
│   │   │   │   ├── cultural_sensitivity.py
│   │   │   │   └── tone_consistency.py
│   │   │   └── custom/          # 사용자 정의 스킬 (.md 파일)
│   │   │       └── *.md
│   │   └── data/                # Knowledge base, FAISS index, guides
│   ├── scripts/
│   │   └── ingest_data.py       # FAISS 인덱스 빌더
│   └── .env.template            # 환경변수 템플릿
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # 진입점
│   │   ├── app/
│   │   │   ├── router.tsx       # React Router (5 routes)
│   │   │   └── providers.tsx    # QueryClient + EventBridge
│   │   ├── pages/
│   │   │   ├── home/            # 대시보드
│   │   │   ├── new-workflow/    # 5단계 워크플로우 위자드
│   │   │   ├── workflow-list/   # 캠페인 목록
│   │   │   ├── workflow-detail/ # 캠페인 상세
│   │   │   └── settings/        # Skill Authoring + Management
│   │   ├── components/          # Legacy JSX 컴포넌트
│   │   ├── shared/
│   │   │   ├── api/             # Fetch 래퍼, SSE 리더, API 타입
│   │   │   ├── state/           # Zustand store, EventBridge
│   │   │   ├── styles/          # CSS 변수 토큰, 글로벌 스타일
│   │   │   └── ui/              # 공통 UI (Button, Card, Badge, Toast, ...)
│   │   ├── features/            # 도메인 API 훅 (skill, case, approval)
│   │   └── widgets/             # 복합 위젯 (timeline, inbox)
│   └── vite.config.ts           # Vite + 프록시 설정
├── docs/                        # 아키텍처 문서, 인사이트
├── CLAUDE.md                    # Claude Code 가이드
└── pyproject.toml               # Python 의존성 (uv)
```

---

## Getting Started

### Prerequisites

- Python 3.14+ & [uv](https://github.com/astral-sh/uv)
- Node.js 18+
- PostgreSQL 16+

### 1. Environment Setup

```bash
# 환경변수 설정
cp backend/.env.template backend/.env
# .env 파일을 열어 아래 값을 채워주세요:
#   AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT
#   EMBEDDING_DEPLOYMENT, TAVILY_API_KEY, DATABASE_URL
```

### 2. Backend

```bash
# 의존성 설치
uv sync

# FAISS 벡터 인덱스 빌드 (최초 1회)
cd backend/scripts && python ingest_data.py --index-path ../data/faiss_index

# 서버 실행
cd backend && uvicorn app.main:app --reload --port 5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### 4. Production Build

```bash
cd frontend && npm run build
```

---

## API Endpoints

### Campaign Workflow

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/campaigns/analyze` | LangGraph 분석 파이프라인 (SSE) |
| POST | `/api/v1/campaigns/generate-brief` | AI 브리프 자동생성 |
| POST | `/api/v1/campaigns/strategic-message` | 전략 메시지 추출 |
| POST | `/api/v1/campaigns/generate-copy` | 국가별 카피 생성 |
| POST | `/api/v1/campaigns/review` | 스킬 기반 리뷰 (SSE) |
| POST | `/api/v1/campaigns/chat` | Q&A 어시스턴트 |
| POST | `/api/v1/campaigns/save` | 캠페인 저장 |

### Skill Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/skills` | 전체 스킬 목록 (builtin + custom) |
| POST | `/api/v1/skills` | 커스텀 스킬 등록 |
| GET | `/api/v1/skills/{id}` | 스킬 상세 조회 |
| PUT | `/api/v1/skills/{id}` | 커스텀 스킬 수정 |
| DELETE | `/api/v1/skills/{id}` | 커스텀 스킬 삭제 |
| POST | `/api/v1/skills/generate-draft` | AI 스킬 초안 생성 |

### Dashboard & History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/stats` | 대시보드 통계 |
| GET | `/api/v1/campaigns` | 캠페인 목록 |
| GET | `/api/v1/campaigns/{id}` | 캠페인 상세 |
| GET | `/api/v1/campaigns/review/history` | 리뷰 이력 |

---

## Skill System

### Builtin Skills (6)

| Skill | Category | Description |
|-------|----------|-------------|
| AI Washing Risk Check | validation | AI 관련 과장/오해 소지 표현 감지 |
| Brand Lexicon Check | validation | LG 브랜드 용어 가이드라인 준수 검증 |
| Campaign Brief Normalizer | validation | 브리프 항목 표준화 및 일관성 검증 |
| Channel Variant Generator | generation | 채널별(SNS, 배너, 영상) 카피 변형 생성 |
| Cultural Sensitivity Check | validation | 문화적 민감성 및 현지화 적합성 검증 |
| Tone Consistency Guard | validation | 톤 앤 매너 일관성 유지 검증 |

### Custom Skills

사용자가 Settings > Skill Authoring에서 직접 생성할 수 있습니다.
커스텀 스킬은 `backend/app/skills/custom/` 폴더에 Markdown 파일로 저장됩니다:

```markdown
---
id: banmal-detection-skill
label: 반말(비격식체) 표현 검출
description: 카피라이팅 문구에서 반말 표현 자동 검출
category: validation
is_active: true
created_at: 2026-03-24T02:19:19+00:00
updated_at: 2026-03-24T07:41:38+00:00
---

# Prompt Template

(LLM이 카피를 평가할 때 사용하는 프롬프트)

# Output Schema

```json
{
  "score": 0-100,
  "passed": true/false,
  "strengths": [],
  "weaknesses": [],
  "improvements": []
}
```
```

---

## Design Philosophy

1. **Localization-Centric** — 단순 번역이 아닌 국가별 소비자 감성, 문화적 뉘앙스를 반영한 카피 최적화
2. **Human-in-the-Loop (HITL)** — AI 자동화 워크플로우 중간에 마케터의 참여와 승인 단계 배치
3. **Multi-Agent Pipeline** — 분석/생성/검증 역할을 분리한 LangGraph 기반 에이전트 파이프라인
4. **LG Brand Identity** — LG Red (#A50034) 기반 프리미엄 톤 앤 매너, BCG 가이드라인 준수

---

## Contributing

정현님과 지비오의 협업 프로젝트입니다. 자세한 개발 가이드는 [CLAUDE.md](./CLAUDE.md)를 참고하세요.
