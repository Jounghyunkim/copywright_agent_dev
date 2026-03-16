import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas import CampaignBrief, AnalysisResponse, ChatRequest, ChatResponse, GenerateBriefRequest, GenerateBriefResponse
from .graph import app_graph

load_dotenv(dotenv_path='.env')

app = FastAPI(title="Copywrite Agent API")

# --- CORS Middleware ---
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:5001", # Added new frontend port
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Copywrite Agent Backend API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/v1/campaigns/analyze", response_model=AnalysisResponse)
async def analyze_campaign(brief: CampaignBrief):
    print(f"Received analysis request for: {brief.projectName}")
    try:
        inputs = {"brief": brief.dict()}
        result = await app_graph.ainvoke(inputs)
        return {
            "status": "success",
            "message": "Analysis completed successfully.",
            "data": result.get("analysis_report", {})
        }
    except FileNotFoundError as e:
        print(f"FAISS index not found: {e}")
        raise HTTPException(status_code=503, detail="Knowledge base index not found. Please run the data ingestion script first.")
    except Exception as e:
        print(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/api/v1/campaigns/generate-brief", response_model=GenerateBriefResponse)
async def generate_brief(request: GenerateBriefRequest):
    from langchain_openai import AzureChatOpenAI
    from langchain_core.messages import HumanMessage, SystemMessage
    from langchain_core.output_parsers import JsonOutputParser

    print(f"Generating brief draft for: {request.projectName}")

    llm = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=0.7,
    )

    brief_guide = """You are a senior LG marketing strategist. Given a project name, generate a complete campaign brief draft following the LG standard brief format.

Return ONLY a valid JSON object with these exact keys (all values as strings in Korean):
{
  "projectContext": "프로젝트 배경 및 중요성 (신제품 런칭, 경쟁사 대응, 소비자 인사이트 등)",
  "objectiveCommercial": "비즈니스 목표 — 매출, 시장 점유율, 신규 고객 유치 등 수치 포함",
  "objectiveBehavior": "행동 목표 — 광고 후 기대 행동 (사이트 방문, 매장 체험 예약, 콘텐츠 공유 등) 수치 포함",
  "objectiveAttitudinal": "인식 목표 — 브랜드 인지도, 선호도, 구매 고려도 변화 등 측정 방법 포함",
  "audience": "Primary/Secondary 타겟 구분, 인구통계, 라이프스타일, 구매 행동, 페인 포인트",
  "keyMessage": "소비자 관점의 핵심 가치 메시지 1-2문장 (기능 나열이 아닌 Benefit 중심, Life's Good 연결)",
  "proofPoints": "Key Message 뒷받침 근거 1~3개 (기술적 우위, 수상/인증, 실적 등 출처 포함)",
  "mandatories": "매체 믹스, 제작물 스펙, 모델, 브랜드 가이드라인, 법적 유의사항",
  "budget": "총 예산 및 매체별 배분 비중",
  "marketNeeds": "타겟 국가/지역, 언어 variation, 문화적 고려사항, 현지 경쟁 환경",
  "timing": "집행 기간, 주요 마일스톤, 페이즈 구분 (티징→런칭→서스테인), 제작 마감일"
}

Each field should be detailed, realistic, and specific to LG products. Write as if you are an experienced LG marketing manager preparing an actual campaign brief."""

    try:
        parser = JsonOutputParser()
        messages = [
            SystemMessage(content=brief_guide),
            HumanMessage(content=f"프로젝트명: {request.projectName}\n\n위 프로젝트에 대한 LG 캠페인 브리프 초안을 JSON으로 작성해 주세요."),
        ]
        response = await llm.ainvoke(messages)
        data = parser.parse(response.content)
        return {"status": "success", "data": data}
    except Exception as e:
        print(f"Brief generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Brief generation failed: {str(e)}")


@app.post("/api/v1/campaigns/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    from langchain_openai import AzureChatOpenAI
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

    llm = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=0.7,
    )

    system_prompt = SystemMessage(content=(
        "You are a professional LG marketing copywriting expert and campaign strategist. "
        "Help users craft effective campaign briefs by answering questions about target audiences, "
        "tone & manner, key benefits, market trends, and copywriting best practices. "
        "Keep answers concise, practical, and actionable. Respond in the same language as the user."
    ))

    history = [system_prompt]
    for msg in request.messages:
        if msg.role == "user":
            history.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            history.append(AIMessage(content=msg.content))

    try:
        response = await llm.ainvoke(history)
        return {"reply": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
