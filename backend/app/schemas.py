from pydantic import BaseModel
from typing import Optional, List

class CampaignBrief(BaseModel):
    # PROJECT & DATE
    projectName: str
    date: str

    # 1. PROJECT CONTEXT
    projectContext: str

    # 2. OBJECTIVE
    objectiveCommercial: str
    objectiveBehavior: str
    objectiveAttitudinal: str

    # 3. AUDIENCE
    audience: str

    # 4. KEY MESSAGE
    keyMessage: str

    # 5. PROOF POINTS
    proofPoints: str

    # 6. MANDATORIES
    mandatories: Optional[str] = ""

    # 7. BUDGET
    budget: Optional[str] = ""

    # 8. MARKET NEEDS
    marketNeeds: str

    # 9. TIMING
    timing: str

class AnalysisResponse(BaseModel):
    status: str
    message: str
    data: Optional[dict] = None

class GenerateBriefRequest(BaseModel):
    projectName: str

class GenerateBriefResponse(BaseModel):
    status: str
    data: dict

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    reply: str
