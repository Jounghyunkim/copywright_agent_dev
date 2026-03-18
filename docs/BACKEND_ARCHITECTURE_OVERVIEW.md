# Backend Architecture Overview — Copywrite Agent v2.0

> 최종 업데이트: 2026-03-18

---

## 1. 기술 스택

| 항목 | 상세 |
|---|---|
| Framework | FastAPI (비동기 REST API) |
| LLM Orchestration | LangGraph (StateGraph 기반 멀티노드 워크플로우) |
| LLM | Azure OpenAI (Chat: GPT-4, Embedding: text-embedding-ada-002) |
| Vector Store | FAISS (로컬 인덱스) |
| Web Search | Tavily API (실시간 시장 정보 수집) |
| LangChain | langchain, langchain-openai, langchain-community |
| 서버 | Uvicorn (기본 포트 5000) |
| 가상환경 | 프로젝트 루트 `.venv/` (Python 3.14.3, uv 패키지 관리) |

---

## 2. 프로젝트 구조

```
backend/
├── app/
│   ├── main.py              # FastAPI 앱, 라우터, 미들웨어
│   ├── graph.py             # LangGraph 워크플로우 (멀티노드 파이프라인)
│   └── schemas.py           # Pydantic 요청/응답 모델
├── scripts/
│   └── ingest_data.py       # Knowledge Base → FAISS 인덱스 생성 스크립트
├── data/
│   ├── knowledge_base.txt   # LG 광고 카피 샘플 데이터 (7건)
│   ├── faiss_index/         # 벡터 인덱스 (index.faiss, index.pkl)
│   └── market_analyst_report_guide.md  # 리포트 작성 가이드
├── requirements.txt         # Python 의존성
├── .env                     # 환경 변수 (git 제외)
└── .env.template            # 환경 변수 템플릿
```

---

## 3. 환경 변수 (.env)

```bash
# Azure OpenAI — Chat/Completion LLM
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-12-01-preview
AZURE_OPENAI_DEPLOYMENT=your_chat_deployment_name

# Azure OpenAI — Embedding LLM
EMBEDDING_DEPLOYMENT=your_embedding_deployment_name
EMBEDDING_ENDPOINT=https://your-resource.openai.azure.com/

# Tavily — Web Search API
TAVILY_API_KEY=tvly-your_tavily_api_key
```

---

## 4. API 엔드포인트 (main.py)

### CORS 설정
- 허용 Origin: `http://localhost`, `http://localhost:5173`, `http://localhost:5001`
- 전체 메서드/헤더 허용, 자격증명 포함

### 엔드포인트 목록

| 메서드 | 경로 | 요청 모델 | 응답 모델 | 설명 |
|---|---|---|---|---|
| GET | `/` | — | JSON | 서버 상태 메시지 |
| GET | `/health` | — | `{status: "healthy"}` | 헬스체크 (프론트엔드 15초 주기 폴링) |
| POST | `/api/v1/campaigns/analyze` | `CampaignBrief` | `AnalysisResponse` | 브리프 → LangGraph 분석 파이프라인 실행 |
| POST | `/api/v1/campaigns/generate-brief` | `GenerateBriefRequest` | `GenerateBriefResponse` | 프로젝트명 → AI 브리프 초안 생성 |
| POST | `/api/v1/campaigns/chat` | `ChatRequest` | `ChatResponse` | 대화형 Q&A (브리프 작성 도우미) |

---

## 5. Pydantic 스키마 (schemas.py)

### CampaignBrief (분석 요청)

```
projectName: str              # 프로젝트명
date: str                     # 날짜
projectContext: str            # 1. 프로젝트 배경
objectiveCommercial: str       # 2. 비즈니스 목표
objectiveBehavior: str         # 2. 행동 목표
objectiveAttitudinal: str      # 2. 인식 목표
audience: str                  # 3. 타겟 오디언스
keyMessage: str                # 4. 핵심 메시지
proofPoints: str               # 5. 근거
mandatories: Optional[str]     # 6. 필수 요건 (선택)
budget: Optional[str]          # 7. 예산 (선택)
marketNeeds: str               # 8. 시장 정보
timing: str                    # 9. 타이밍
```

### 기타 모델

| 모델 | 용도 | 필드 |
|---|---|---|
| `AnalysisResponse` | 분석 결과 응답 | status, message, data(dict) |
| `GenerateBriefRequest` | 초안 생성 요청 | projectName |
| `GenerateBriefResponse` | 초안 생성 응답 | status, data(dict) |
| `ChatMessage` | 채팅 메시지 단위 | role ('user'/'assistant'), content |
| `ChatRequest` | 채팅 요청 | messages: List[ChatMessage] |
| `ChatResponse` | 채팅 응답 | reply: str |

---

## 6. LangGraph 워크플로우 (graph.py) — 핵심

### 6.1 아키텍처 다이어그램

```
                    ┌──────────────────┐
                    │  query_planner   │  LLM: 검색 쿼리 4개 생성
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    ▼                  ▼
           ┌──────────────┐   ┌───────────────┐
           │  web_search   │   │ enhanced_rag  │  ← 병렬 실행
           │  (Tavily API) │   │ (FAISS k=5)   │
           └──────┬───────┘   └──────┬────────┘
                  │                  │
                  └────────┬─────────┘
                           ▼
                  ┌──────────────────┐
                  │   synthesizer    │  LLM: 모든 정보 합성 → 리포트 JSON
                  └────────┬─────────┘
                           ▼
                          END
```

### 6.2 AgentState

```python
class AgentState(TypedDict):
    brief: dict              # 입력: 캠페인 브리프 전체
    search_queries: list     # query_planner 출력
    web_results: list        # web_search 출력
    rag_results: list        # enhanced_rag 출력
    analysis_report: dict    # synthesizer 출력 (최종 결과)
```

### 6.3 NODE 1: query_planner

| 항목 | 상세 |
|---|---|
| 입력 | `brief` |
| 출력 | `search_queries` (문자열 배열 4개) |
| LLM | AzureChatOpenAI (temperature=0) |
| 역할 | Brief를 분석하여 4개의 영어 웹 검색 쿼리 생성 |

**쿼리 포커스 영역**:
1. 경쟁사 현황 및 포지셔닝
2. 소비자 트렌드 및 행동 패턴
3. 시장 규모, 성장률, 업계 트렌드
4. 경쟁사 광고/메시징 트렌드

**Fallback**: JSON 파싱 실패 시 Brief 필드에서 기본 쿼리 4개 자동 생성

### 6.4 NODE 2a: web_search (병렬)

| 항목 | 상세 |
|---|---|
| 입력 | `search_queries` |
| 출력 | `web_results` (배열: {title, url, content}) |
| 도구 | Tavily AsyncClient |
| 설정 | 쿼리당 max 3결과, search_depth="basic" |

- URL 기준 중복 제거
- content는 500자로 제한
- **Graceful fallback**: `TAVILY_API_KEY` 미설정 또는 검색 실패 시 빈 배열 반환

### 6.5 NODE 2b: enhanced_rag (병렬)

| 항목 | 상세 |
|---|---|
| 입력 | `brief`, `search_queries` |
| 출력 | `rag_results` (문서 내용 문자열 배열) |
| 벡터스토어 | FAISS (로컬 인덱스) |
| 임베딩 | AzureOpenAIEmbeddings |

**멀티쿼리 전략**:
- Brief 기반 쿼리 2개 + search_queries에서 2개 = 총 4개 쿼리
- 쿼리당 k=5 문서 검색
- 문서 content hash 기반 중복 제거
- **Graceful fallback**: FAISS 인덱스 미존재 또는 오류 시 빈 배열 반환

### 6.6 NODE 3: synthesizer

| 항목 | 상세 |
|---|---|
| 입력 | `brief`, `web_results`, `rag_results` |
| 출력 | `analysis_report` (JSON) |
| LLM | AzureChatOpenAI (temperature=0) |
| 파서 | JsonOutputParser(pydantic_object=AnalysisReport) |

**프롬프트 구조**:

```
시스템 역할 선언
  → "카피라이팅 디렉터이자 마케팅 전략가"
  → "Report는 '말이 작동하는 맥락'을 정의하는 문서"

컨텍스트 섹션
  1. Real-Time Market Intelligence (web_results 포맷팅)
  2. Historical LG Campaign References (rag_results 포맷팅)
  3. Campaign Brief 전체 필드

출력 지시 (10개 필드 상세 가이드라인)
```

---

## 7. AnalysisReport 출력 스키마 (10개 필드)

`market_analyst_report_guide.md` 기반으로 설계된 카피라이팅 전용 리포트:

### 기존 6개 항목 (심화)

| # | 필드 | 키 | 카피라이팅 관점 |
|---|---|---|---|
| 1 | **Brief Summary & AI Direction** | `briefSummary` | Brief 요약 ❌ → Copywriting Direction 변환 ✅ |
| | | `.objective` | 3개 목표를 커뮤니케이션 미션으로 재프레이밍 |
| | | `.coreChallenge` | 경쟁 환경 기반 최대 커뮤니케이션 장벽 |
| | | `.aiDirection` | 카피라이터를 위한 크리에이티브 방향 선언 |
| | | `.toneRole` | 카피의 톤과 역할 선언 |
| 2 | **Deep-dive Persona** | `persona` | 인구통계 ❌ → 심리적 초상화 ✅ |
| | | `.avatar` | DiceBear URL 자동 생성 |
| | | `.name` | 아키타입 이름 ("The Experience Seeker") |
| | | `.belief` | 카테고리에 대한 현재 믿음 |
| | | `.frustration` | 숨겨진 불만 |
| | | `.purchaseTrigger` | 구매 행동을 촉발하는 순간 |
| | | `.emotionalTriggerWords` | 감정적으로 반응하는 단어 4-6개 |
| 3 | **Brand Fit Score** | `brandFit` | 점수에 따라 선언형 vs 설명형 카피 결정 |
| | | `.score` | 0-100 (높으면 선언형, 낮으면 설명형) |
| | | `.functionalFit` | 기술/제품 적합성 |
| | | `.emotionalFit` | "Life's Good" 감정 자산 정합 |
| | | `.culturalFit` | 시대적 흐름 연결 |
| 4 | **Market Opportunity & Risk** | `marketAnalysis` | "이 메시지가 먹힐 공간" + "실패할 공간" |
| | | `.opportunityGap` | 경쟁사가 미점유한 메시징 각도 |
| | | `.riskKeyword` | 피해야 할 표현/프레이밍 |
| | | `.untappedKeywords` | 감각/감정/경험 키워드 5-8개 (스펙 ❌) |
| 5 | **Competitive Keywords** | `competitiveKeywords[]` | "의미가 소진된 언어" (쓰면 안 되는 단어) |
| | | `.word` | 경쟁사가 점유한 키워드 |
| | | `.count` | 포화도 0-100 |

### 신규 4개 항목 (가이드 기반)

| # | 필드 | 키 | 설명 |
|---|---|---|---|
| 6 | **Category Narrative Shift** | `categoryNarrative` | 시장의 기존 언어 → 우리의 새로운 언어 |
| | | `.oldNarrative` | "Better TV = Brighter, Bigger, More Numbers" |
| | | `.newNarrative` | "Better TV = Deeper feelings, quieter moments" |
| 7 | **Emotional JTBD** | `emotionalJTBD` | 소비자가 감정적으로 해결하고 싶은 일 — 카피의 뿌리 문장 |
| 8 | **Cultural Tension Map** | `culturalTension.tensions[]` | 시대적 감정 긴장 2-4개 (예: "시끄러운 세상 vs 고요한 깊이에 대한 갈망") |
| 9 | **Copy Implications & Guardrails** | `copyImplications` | 카피라이터를 위한 실행 가드레일 |
| | | `.doList[]` | 3-5개 "이렇게 써라" (예: "천천히, 시각적으로, 감정적으로 써라") |
| | | `.dontList[]` | 3-5개 "이건 하지 마라" (예: "스펙 시트처럼 OLED를 설명하지 마라") |
| 10 | **Recommended Keywords** | `recommendedKeywords[]` | untapped + new narrative + JTBD 기반 추천 키워드 5-8개 |

---

## 8. 브리프 초안 생성 (/generate-brief)

- **입력**: `projectName` (문자열)
- **LLM**: AzureChatOpenAI (temperature=0.7)
- **시스템 프롬프트**: LG 시니어 마케팅 전략가 역할, brief_guide.txt 기반 항목별 지시
- **출력**: 11개 필드 JSON (projectContext ~ timing, 모두 한국어)
- **프론트엔드 연동**: 응답 JSON으로 formData 업데이트 (projectName, date는 유지)

---

## 9. 채팅 Q&A (/chat)

- **시스템 프롬프트**: LG 마케팅 카피라이팅 전문가 역할
- **대화 이력**: 프론트엔드가 전체 messages 배열 전송 → LangChain HumanMessage/AIMessage 변환
- **용도**: 브리프 작성 도우미 + 가이드 설명 보충

---

## 10. 데이터 파이프라인 (ingest_data.py)

```
knowledge_base.txt
    ↓  RecursiveCharacterTextSplitter (chunk_size=1000, overlap=200)
    ↓  AzureOpenAIEmbeddings
    ↓  FAISS.from_documents()
    ↓  save_local("../data/faiss_index")
faiss_index/
    ├── index.faiss
    └── index.pkl
```

**실행**: `python scripts/ingest_data.py --index-path ../data/faiss_index`

### Knowledge Base 현황 (7건)

| 제품 | 국가 | 톤 |
|---|---|---|
| LG OLED TV | USA | Emotional |
| LG Gram Laptop | Germany | Rational |
| LG InstaView Refrigerator | USA | Human |
| LG CordZero Vacuum | Korea | Technical |
| LG PuriCare AeroTower | India | Emotional |
| LG Objet Collection | Global | Aspirational |
| LG Soundbar | USA | Technical |

---

## 11. 의존성 (requirements.txt)

```
fastapi              # REST API 프레임워크
uvicorn              # ASGI 서버
pydantic             # 데이터 검증/스키마
python-dotenv        # .env 파일 로드
langgraph            # 멀티노드 에이전트 오케스트레이션
langchain            # LLM 체인/프롬프트
langchain-openai     # Azure OpenAI 통합
langchain-community  # FAISS 벡터스토어 통합
openai               # OpenAI 클라이언트
faiss-cpu            # 벡터 유사도 검색
tiktoken             # 토크나이저
langchain-text-splitters  # 텍스트 청킹
tavily-python        # 웹 검색 API
```

---

## 12. 에러 처리 및 Graceful Degradation

| 상황 | 처리 |
|---|---|
| FAISS 인덱스 미존재 | 503 에러 + "Please run the data ingestion script" 메시지 |
| TAVILY_API_KEY 미설정 | 경고 로그 후 web_results 빈 배열로 진행 |
| 웹 검색 API 실패 | 개별 쿼리 실패 skip, 나머지 결과로 진행 |
| RAG 검색 실패 | 경고 로그 후 rag_results 빈 배열로 진행 |
| LLM 호출 실패 (분석) | 500 에러 + 상세 에러 메시지 반환 |
| LLM 호출 실패 (채팅) | 500 에러 + 에러 detail 반환 |
| JSON 파싱 실패 (query_planner) | Brief 필드 기반 기본 쿼리 4개로 fallback |

**핵심 원칙**: Web Search와 RAG 모두 실패해도 LLM의 내재 지식으로 리포트 생성 가능. 모든 외부 데이터 소스는 보강(augmentation) 역할.

---

## 13. 실행 방법

```bash
# 1. 가상환경 활성화
source .venv/bin/activate

# 2. 의존성 설치 (최초 1회)
uv pip install -r backend/requirements.txt

# 3. FAISS 인덱스 생성 (최초 1회)
cd backend/scripts && python ingest_data.py

# 4. 백엔드 서버 실행
cd backend && uvicorn app.main:app --reload --port 5000
```
