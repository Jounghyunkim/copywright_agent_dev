# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered copywriting platform for LG brand campaigns. Users fill a campaign brief, which flows through a LangGraph agent pipeline (web search + RAG + LLM synthesis) to produce a 10-field Market Analyst Report. The frontend visualizes the report as an interactive card grid with human-in-the-loop approval.

## Development Commands

### Backend (FastAPI on port 5000)
```bash
cd backend && uvicorn app.main:app --reload --port 5000
```

### Frontend (Vite dev server on port 5173, proxies /api to backend)
```bash
cd frontend && npm run dev
```

### Build frontend for production
```bash
cd frontend && npm run build
```

### Rebuild FAISS vector index (one-time or when knowledge base changes)
```bash
cd backend/scripts && python ingest_data.py --index-path ../data/faiss_index
```

### Python dependency management (uses `uv`, Python 3.14)
```bash
uv sync                    # install dependencies from pyproject.toml
uv add <package>           # add a new dependency
```

## Architecture

### Backend (`backend/app/`)

- **main.py** — FastAPI app with three main endpoints:
  - `POST /api/v1/campaigns/analyze` — Runs LangGraph workflow, returns Market Analyst Report
  - `POST /api/v1/campaigns/generate-brief` — AI auto-generates brief fields from project name
  - `POST /api/v1/campaigns/chat` — Q&A assistant
- **graph.py** — LangGraph StateGraph defining the agent pipeline:
  - `query_planner` → `[web_search ∥ enhanced_rag]` (parallel) → `synthesizer` → END
  - Uses `AgentState` TypedDict to carry data between nodes (brief, search_queries, web_results, rag_results, analysis_report)
- **schemas.py** — Pydantic models: `CampaignBrief` (13 fields), `AnalysisResponse`, `ChatMessage`, etc.
- **data/** — Knowledge base text, FAISS index, and guide markdown files for prompt engineering

### Frontend (`frontend/src/`)

- **React 18 + Vite**, no routing library (view state: 'dashboard' | 'editor')
- **Styling**: Inline CSS-in-JS only, theme constants in `styles/theme.js` (LG brand colors, `LG_RED: '#A50034'`)
- **Editor.jsx** (~1278 lines) — Main page with resizable left/right panels (brief form + chat | report view), manages the 5-step workflow state
- **BriefingForm.jsx** — 9-section collapsible form with validation; "AI 자동생성" button calls generate-brief endpoint
- **AnalysisReport.jsx** — Renders the 10-field report as a CSS Grid (12-column) card layout with approve/modify HITL buttons
- **WorkflowStepper.jsx** — 5-step progress indicator (Briefing → Analysis → Strategic Message → Generation → Review)
- **App.jsx** — Root component, polls `GET /health` every 15 seconds for backend connectivity

### LLM Integration

- **Provider**: Azure OpenAI (chat model + embeddings)
- **Web search**: Tavily API
- **Vector store**: FAISS (local, stored in `backend/data/faiss_index/`)
- **Environment variables**: Configured in `backend/.env` (see `backend/.env.template` for required keys: `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `EMBEDDING_DEPLOYMENT`, `TAVILY_API_KEY`)

### Analysis Report Output Schema (10 fields)

briefSummary, persona, brandFit (score 0-100), marketAnalysis, competitiveKeywords, categoryNarrative (old→new), emotionalJTBD, culturalTension, copyImplications (do/don't), recommendedKeywords

## Key Patterns

- Frontend proxies API calls through Vite config (`vite.config.js`), no direct backend URL in components
- No test suite is currently configured
- UI language is mixed Korean/English (Korean labels, English data)
- All state management is component-local (useState/useRef), no global state library
- Commit messages are in mixed Korean/English
