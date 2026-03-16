from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .schemas import CampaignBrief, AnalysisResponse
from .graph import app_graph

app = FastAPI(title="Copywrite Agent API")

# --- CORS Middleware ---
origins = [
    "http://localhost",
    "http://localhost:5173",
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
    inputs = {"brief": brief.dict()}
    result = await app_graph.ainvoke(inputs)
    return {
        "status": "success",
        "message": "Analysis completed successfully.",
        "data": result.get("analysis_report", {})
    }
