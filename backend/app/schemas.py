from pydantic import BaseModel, field_validator
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

class AnalyzeRequest(BaseModel):
    """Analysis 요청 — Campaign Brief + optional Message Matrix."""
    projectName: str
    date: str
    projectContext: str
    objectiveCommercial: str
    objectiveBehavior: str
    objectiveAttitudinal: str
    audience: str
    keyMessage: str
    proofPoints: str
    mandatories: Optional[str] = ""
    budget: Optional[str] = ""
    marketNeeds: str
    timing: str
    message_matrix: Optional[dict] = None  # {sheetName: ProductInfo}
    locale: Optional[str] = "ko"  # UI display language: en, ko, de

class AnalysisResponse(BaseModel):
    status: str
    message: str
    data: Optional[dict] = None

class GenerateBriefRequest(BaseModel):
    projectName: str
    projectContext: str

    @field_validator("projectName")
    @classmethod
    def validate_project_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Project Name must be at least 3 characters.")
        # 의미 없는 입력 거부: 동일 문자 반복, 숫자만, 알파벳 1~2자 패턴
        stripped = v.replace(" ", "")
        if len(set(stripped)) <= 1:
            raise ValueError("Project Name is not meaningful. Please provide a descriptive name.")
        return v

    @field_validator("projectContext")
    @classmethod
    def validate_project_context(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 20:
            raise ValueError("Project Context must be at least 20 characters. Please describe the campaign background.")
        words = v.split()
        if len(words) < 5:
            raise ValueError("Project Context must contain at least 5 words. Please provide sufficient context.")
        return v

class GenerateBriefResponse(BaseModel):
    status: str
    data: dict

class StrategicMessageRequest(BaseModel):
    brief: dict
    analysisReport: dict
    locale: Optional[str] = "ko"

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
    currentStep: Optional[int] = 1
    context: Optional[dict] = None  # {brief, analysisReport, strategicMessage, copyResults, reviewResults}

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

class CorrectionImprovement(BaseModel):
    skillId: str
    text: str

class CorrectionRequest(BaseModel):
    copyKey: str
    copyData: dict           # {headline, subheadline, bodyCopy, cta, ...}
    improvements: List[CorrectionImprovement]

class CorrectionResponse(BaseModel):
    headline: str = ""
    subheadline: str = ""
    bodyCopy: str = ""
    cta: str = ""

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


# --- Skill Draft Generation ---

class SkillDraftRequest(BaseModel):
    name: str             # 스킬 이름
    purpose: str          # 작성 목적
    goal: str             # 스킬 목적
    goodExample: Optional[str] = None  # 좋은 예시
    badExample: Optional[str] = None   # 나쁜 예시


# --- Campaign Save ---

class CampaignSaveRequest(BaseModel):
    brief: dict
    analysisReport: Optional[dict] = None
    strategicMessage: Optional[dict] = None
    copyResults: Optional[list] = None
    reviewSummary: Optional[dict] = None
    reviewResults: Optional[list] = None
    copyCandidates: Optional[dict] = None
    currentStep: int = 1


# --- Message Matrix ---

class MessageMatrixUSP(BaseModel):
    usp_no: str
    feature_name: str
    key_message_full: str = ""
    key_message_short: str = ""
    benefit_description: str = ""
    rtb: str = ""
    disclaimer: str = ""
    certification: str = ""
    remark: str = ""

class MessageMatrixCategory(BaseModel):
    number: str
    name: str
    key_message: str = ""
    usps: List[MessageMatrixUSP] = []

class MessageMatrixProduct(BaseModel):
    product_name: str
    sub_name: str = ""
    head_message: str = ""
    description: str = ""
    categories: List[MessageMatrixCategory] = []

class MessageMatrixSheetsResponse(BaseModel):
    sheets: List[str]

class MessageMatrixParseResponse(BaseModel):
    results: dict  # {sheet_name: MessageMatrixProduct}
