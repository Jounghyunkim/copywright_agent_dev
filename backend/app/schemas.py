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
    projectContext: str

class GenerateBriefResponse(BaseModel):
    status: str
    data: dict

class StrategicMessageRequest(BaseModel):
    brief: dict
    analysisReport: dict

class StrategicMessageResponse(BaseModel):
    status: str
    data: Optional[dict] = None

class GenerationConfig(BaseModel):
    countries: List[str]
    ageGroups: List[str]
    personas: List[str]
    skillsets: List[str]
    copyCount: int = 3

class GenerateCopyRequest(BaseModel):
    brief: dict
    analysisReport: dict
    strategicMessage: dict
    config: GenerationConfig

class GenerateCopyResponse(BaseModel):
    status: str
    data: Optional[list] = None

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    reply: str


# --- Review ---

class SelectedCopy(BaseModel):
    key: str               # e.g. "US-0"
    countryCode: str
    copyData: dict         # {headline, subheadline, bodyCopy, cta, ...}

class ReviewRequest(BaseModel):
    brief: dict
    analysisReport: dict
    strategicMessage: dict
    selectedCopies: List[SelectedCopy]
    enabledSkills: List[str]

class ReviewSessionResponse(BaseModel):
    id: str
    project_name: str
    status: str
    enabled_skills: list
    created_at: str
    completed_at: Optional[str] = None
    results: Optional[list] = None

class ReviewHistoryResponse(BaseModel):
    sessions: list


# --- Custom Skill CRUD ---

class CustomSkillCreate(BaseModel):
    id: str
    label: str
    description: str
    category: str        # validation / generation / analysis
    prompt_template: str
    reference_docs: Optional[list] = None
    output_schema: Optional[dict] = None

class CustomSkillUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    prompt_template: Optional[str] = None
    reference_docs: Optional[list] = None
    output_schema: Optional[dict] = None
    is_active: Optional[bool] = None

class SkillResponse(BaseModel):
    id: str
    label: str
    description: str
    category: str
    type: str            # builtin / custom
    editable: bool
