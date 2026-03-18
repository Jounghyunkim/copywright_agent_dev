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

    # Load objective generation guide from file
    guide_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "brief_objective_gen_guide.md")
    try:
        with open(guide_path, "r", encoding="utf-8") as f:
            objective_guide = f.read()
    except FileNotFoundError:
        objective_guide = ""
        print(f"WARNING: Objective guide not found at {guide_path}")

    brief_guide = f"""You are a senior Brand Strategist with 15+ years of experience in global campaign planning for LG Electronics.
You are given a Project Name and a Project Context that describes WHY this campaign is needed. Use these two inputs to generate the REMAINING fields of an LG standard campaign brief.

Your output must be deeply informed by the Project Context — the objectives, audience, messaging, and strategy should all directly stem from the stated context and reasons for the campaign.

## Objective 작성 지침 (매우 중요 — 반드시 아래 가이드를 따르세요)

{objective_guide}

## 나머지 항목 작성 지침

나머지 항목들도 Project Context에서 논리적으로 파생되어야 합니다.

## 출력 형식

Return ONLY a valid JSON object with these exact keys (all values as strings in Korean):
{{
  "objectiveCommercial": "위 Objective 가이드의 Commercial 지침에 따라 1~2개 항목을 작성. 각 항목은 '~하는 것입니다' 형태의 완결된 문장.",
  "objectiveBehavior": "위 Objective 가이드의 Behavior 지침에 따라 1~2개 항목을 작성. 타깃의 동기를 반영한 완결된 문장.",
  "objectiveAttitudinal": "위 Objective 가이드의 Attitudinal 지침에 따라 1~2개 항목을 작성. Context의 고유 키워드를 활용한 완결된 문장.",
  "audience": "Primary/Secondary 타겟을 Project Context의 제품/시장에 맞춰 구체적으로 정의 — 인구통계, 라이프스타일, 구매 행동, 페인 포인트 포함",
  "keyMessage": "Project Context의 핵심 가치를 소비자 관점의 Benefit으로 변환한 1-2문장 (기능 나열 아닌 감정적 가치, Life's Good 연결)",
  "proofPoints": "Key Message 뒷받침 근거 1~3개 — Project Context에서 언급된 기술적 우위, 수상, 실적 등을 구체적 출처와 함께 서술",
  "mandatories": "Project Context의 시장/채널 특성에 맞는 매체 믹스, 제작물 스펙, 브랜드 가이드라인 준수 사항",
  "budget": "캠페인 규모에 적합한 총 예산 및 매체별 배분 비중 제안",
  "marketNeeds": "Project Context에서 파악한 타겟 국가/지역, 언어 variation, 문화적 고려사항, 현지 경쟁 환경",
  "timing": "Project Context의 런칭/시즌 정보에 맞춘 집행 기간, 페이즈 구분 (티징→런칭→서스테인), 제작 마감일"
}}

IMPORTANT: Every field must logically connect back to the Project Context. Do not generate generic content — make it specific to THIS project."""

    try:
        parser = JsonOutputParser()
        messages = [
            SystemMessage(content=brief_guide),
            HumanMessage(content=f"프로젝트명: {request.projectName}\n\nProject Context:\n{request.projectContext}\n\n위 프로젝트의 배경과 맥락을 바탕으로, 나머지 브리프 항목을 JSON으로 작성해 주세요."),
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
