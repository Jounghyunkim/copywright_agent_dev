import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas import CampaignBrief, AnalysisResponse, ChatRequest, ChatResponse
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
