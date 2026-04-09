# Backend Architecture Overview

> Last updated: 2026-04-08

---

## 1. Tech Stack

| Item | Detail |
|------|--------|
| Framework | FastAPI (async REST API + SSE streaming) |
| LLM Orchestration | LangGraph (StateGraph-based multi-node workflow) |
| LLM | Azure OpenAI (Chat: GPT-4o, Embedding: text-embedding-ada-002) |
| Vector Store | FAISS (local index at `backend/data/faiss_index/`) |
| Web Search | Tavily API |
| Database | PostgreSQL 16 + SQLAlchemy 2.0 async (asyncpg driver) |
| Skill System | 3-tier: Python builtin (6) + SKILL.md (57) + Custom (N) |
| Server | Uvicorn (port 5000) |
| Package Manager | uv (Python 3.14) |

---

## 2. Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app — 28 endpoints
│   ├── graph.py             # LangGraph 4-node DAG pipeline
│   ├── schemas.py           # Pydantic request/response models
│   ├── models.py            # SQLAlchemy ORM (4 models)
│   ├── database.py          # DB engine + session + auto-migration
│   └── skills/
│       ├── catalog.py       # 3-tier skill catalog (builtin + skillmd + custom)
│       ├── loader.py        # SKILL.md file discovery & loading
│       ├── parser.py        # YAML frontmatter + Markdown body parser
│       ├── routing_policy.py # Auto skill selection (must-have + conditional trigger)
│       ├── deep_agent.py    # DeepAgent executor (skill-aware copy generation)
│       ├── creative_personas.py # AI Writer persona system (10 personas)
│       ├── runner.py        # Parallel skill execution orchestrator
│       ├── skillmd_runner.py # SKILL.md-based review executor
│       ├── custom_runner.py # Template-based custom skill executor
│       ├── builtin/         # 6 Python-coded review functions
│       └── custom/          # User-created custom skills (file-based)
├── skills/                  # 57 SKILL.md files (evaluation, generation, persona, culture)
├── data/
│   ├── faiss_index/         # FAISS vector store
│   ├── knowledge_base.txt   # Sample copy examples
│   └── *.md                 # Prompt engineering guides
├── tools/
│   └── message_matrix_parsing.py  # Excel Message Matrix parser
└── .env                     # Azure OpenAI + Tavily API keys
```

---

## 3. Database Models (4 tables)

### Campaign
| Column | Type | Note |
|--------|------|------|
| id | UUID (PK) | auto-generated |
| project_name | String(255) | NOT NULL |
| brief | JSONB | NOT NULL |
| analysis_report | JSONB | nullable (partial save) |
| strategic_message | JSONB | nullable |
| copy_results | JSONB (list) | nullable |
| review_summary | JSONB | nullable |
| review_results | JSONB (list) | nullable |
| copy_candidates | JSONB | nullable (persona candidates) |
| target_countries | JSONB (list) | derived on save |
| brand_fit_score | SmallInt | 0-100 |
| review_avg_score | SmallInt | 0-100 |
| total_copies | Int | count |
| current_step | SmallInt | 1-5, default 1 |
| status | String(20) | "draft" or "completed" |
| created_at | Timestamp(tz) | auto |
| updated_at | Timestamp(tz) | auto on update |

### ReviewSession / ReviewResult
- Session tracks a review execution (status: pending/running/completed/failed)
- Result stores per-skill evaluation (skill_id, target_copy_key, passed, score, findings, suggestions)

### CustomSkill
- File-based custom skills with prompt_template and output_schema

---

## 4. LangGraph Pipeline (`graph.py`)

```
query_planner → [web_search ∥ enhanced_rag] → synthesizer → END
```

| Node | Input | Output | Integration |
|------|-------|--------|-------------|
| query_planner | brief + message_matrix | 4 search queries | Azure OpenAI |
| web_search | search_queries | up to 12 web results | Tavily API (async) |
| enhanced_rag | brief + queries | retrieved docs | FAISS + Azure Embeddings |
| synthesizer | all above | AnalysisReport (10 fields) | Azure OpenAI (JSON output) |

**AnalysisReport fields**: briefSummary, persona, brandFit (score 0-100), marketAnalysis, competitiveKeywords, categoryNarrative, emotionalJTBD, culturalTension, copyImplications, recommendedKeywords

---

## 5. Skill System (3-Tier)

### Tier 1: Python Builtin (6)
Hardcoded functions in `skills/builtin/`:
`ai-washing-risk-check`, `brand-lexicon-check`, `campaign-brief-normalizer`, `channel-variant-generator`, `cultural-sensitivity-check`, `tone-consistency-guard`

### Tier 2: SKILL.md (57 files in `backend/skills/`)
YAML frontmatter + Markdown body, loaded by `SkillLoader`:

| Category | Count | Examples |
|----------|-------|---------|
| Evaluation | 18 | compliance-redflag-detector, lg-brand-fit-check, copy-scorecard-generator |
| Generation | 4 | global-core-copy-generation, headline-body-cta-composer, tone-and-voice-enforcer |
| Localization | 4 | language-transcreation, regional-copy-adaptation, localization-base |
| AI Writer Personas | 11 | writer-metaphor-master, writer-viral-specialist, writer-storyteller |
| Culture Profiles | 20 | culture-usa, culture-japan, culture-germany, culture-india ... |

### Tier 3: Custom (User-created)
Template-based skills stored in DB with `{{variable}}` placeholders.

### Routing Policy
- **Must-have** (always ON): `brand-lexicon-check`, `compliance-redflag-detector`, `lg-brand-fit-check`
- **Conditional triggers**: `ai-washing-risk-check` (AI keywords), `environmental-claim-risk-check` (eco keywords), `comparative-ad-risk-check` (comparison keywords)
- **Generation skills**: auto-selects culture profile by market code (JP → culture-japan)

### DeepAgent Executor
1. `_plan_skills()` — LLM selects relevant skills from catalog
2. `_build_skill_context()` — Concatenates SKILL.md bodies (max 3500 chars each)
3. `generate_copy()` — Injects skill context into LLM system prompt
4. `generate_copy_with_personas()` — Parallel generation per AI Writer persona

---

## 6. API Endpoints (28 total)

### Campaign Workflow
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/campaigns/analyze` | LangGraph analysis (SSE streaming) |
| POST | `/api/v1/campaigns/strategic-message` | Strategic message extraction |
| POST | `/api/v1/campaigns/generate-copy` | DeepAgent copy generation |
| POST | `/api/v1/campaigns/generate-copy-candidates` | Persona-based multi-candidate generation |
| POST | `/api/v1/campaigns/generate-brief` | AI auto-generates brief fields |
| POST | `/api/v1/campaigns/chat` | Step-aware Q&A assistant |
| POST | `/api/v1/campaigns/review` | Skill-based review (SSE streaming) |
| POST | `/api/v1/campaigns/correct` | LLM-based copy correction |

### Campaign CRUD
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/campaigns/save` | Create campaign (partial save at any step) |
| PUT | `/api/v1/campaigns/{id}` | Update existing campaign |
| GET | `/api/v1/campaigns/dashboard` | Stats + campaign list |
| GET | `/api/v1/campaigns/{id}` | Full campaign detail |
| DELETE | `/api/v1/campaigns/{id}` | Delete campaign |
| GET | `/api/v1/campaigns/review/history` | Review session history |
| GET | `/api/v1/campaigns/review/{session_id}` | Review session detail |

### Skills
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/skills` | All skills (builtin + skillmd + custom) |
| GET | `/api/v1/skills/catalog` | Skills by category |
| POST | `/api/v1/skills` | Create custom skill |
| GET/PUT/DELETE | `/api/v1/skills/{id}` | Skill CRUD |
| POST | `/api/v1/skills/generate-draft` | AI generates skill template |

### Personas & Culture
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/personas` | AI Writer persona list (10) |
| GET | `/api/v1/culture-profiles` | Culture profile list (20 countries) |

### Message Matrix
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/message-matrix/sheets` | Parse Excel sheet names |
| POST | `/api/v1/message-matrix/parse` | Parse matrix from Excel |
| GET | `/api/v1/message-matrix/sample` | Sample matrix data |

### Health
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Root status |
| GET | `/health` | Health check |

---

## 7. Key Architectural Patterns

- **SSE Streaming**: Analysis and Review endpoints stream progress events in real-time
- **Parallel Execution**: LangGraph DAG (web_search ∥ rag), asyncio.gather for skill × copy review
- **Partial Save**: Campaign can be saved at any step (1-5) with nullable fields
- **Auto-migration**: `init_db()` adds missing columns to existing tables via ALTER TABLE
- **Skill Context Injection**: SKILL.md body loaded and injected into LLM system prompt
- **Persona Divergence**: Multiple AI Writer personas generate competing copy candidates
