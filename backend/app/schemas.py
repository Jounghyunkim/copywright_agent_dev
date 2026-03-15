from pydantic import BaseModel
from typing import Optional

class CampaignBrief(BaseModel):
    projectName: str
    campaignPeriod: str
    targetCountry: str
    targetAudience: str
    toneAndManner: str
    keyBenefits: str

class AnalysisResponse(BaseModel):
    # This will eventually hold the full analysis report structure
    status: str
    message: str
    data: Optional[dict] = None
