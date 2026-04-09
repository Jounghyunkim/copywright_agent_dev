/* Campaign Brief */
export interface CampaignBrief {
  projectName: string
  date: string
  projectContext: string
  objectiveCommercial: string
  objectiveBehavior: string
  objectiveAttitudinal: string
  audience: string
  keyMessage: string
  proofPoints: string
  mandatories: string
  budget: string
  marketNeeds: string
  timing: string
}

/* Analysis Report (10 fields) */
export interface AnalysisReport {
  briefSummary: string
  persona: string
  brandFit: { score: number; explanation: string }
  marketAnalysis: string
  competitiveKeywords: string[]
  categoryNarrative: { old: string; new: string }
  emotionalJTBD: string
  culturalTension: string
  copyImplications: { do: string[]; dont: string[] }
  recommendedKeywords: string[]
}

/* Strategic Message */
export interface StrategicMessageData {
  coreMessage: string
  messagePillars: Array<{ title: string; description: string }>
  emotionalHook: string
  toneDirection: string
  keyPhrases: string[]
}

/* Copy result per country */
export interface CopyResult {
  countryCode: string
  copies: Array<{
    headline: string
    subheadline: string
    bodyCopy: string
    cta: string
    methodology?: string
    culturalNotes?: string
    toneAnalysis?: string
  }>
}

/* Review */
export interface ReviewResult {
  type: 'skill_completed'
  skillId: string
  skillType: string
  targetCopyKey: string
  score: number
  passed: boolean
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
  executionMs?: number
}

export interface ReviewSummary {
  avgScore: number
  passed: number
  failed: number
  total: number
}

/* Dashboard */
export interface DashboardStats {
  totalProjects: number
  avgBrandScore: number
  avgReviewScore: number
  targetRegions: number
}

export interface CampaignListItem {
  id: string
  title: string
  summary: string
  date: string
  countries: string[]
  totalCopies: number
  brandFitScore: number | null
  reviewAvgScore: number | null
  currentStep: number
  status: 'draft' | 'completed'
}

export interface DashboardData {
  stats: DashboardStats
  campaigns: CampaignListItem[]
}

/* Skill (expanded for SKILL.md support) */
export interface Skill {
  id: string
  name: string
  label?: string
  description: string
  category?: string
  type: 'skillmd' | 'custom'
  skill_type?: string
  action_tags?: string[]
  role_tags?: string[]
  risk_level?: string
  prompt_template?: string
  output_schema?: Record<string, unknown>
  is_active?: boolean
  editable?: boolean
  createdAt?: string
  updatedAt?: string
}

/* AI Writer Persona */
export interface AIPersona {
  id: string
  name: string
  avatar: string
  color: string
  tags: string[]
  temperature: number
}

/* Culture Profile */
export interface CultureProfile {
  id: string
  description: string
  country_code: string
}

/* Persona-based copy candidate */
export interface CopyCandidate {
  persona_id: string
  persona_name: string
  persona_avatar: string
  copies: CopyResult[]
  selected_skills: string[]
  skill_reviews: Record<string, string>
}

/* Candidate generation result */
export interface CopyCandidateResult {
  candidates: CopyCandidate[]
  selected_personas: Array<{ id: string; name: string; avatar: string }>
  elapsed_ms: number
}

/* Message Matrix */
export interface MessageMatrixUSP {
  usp_no: string
  feature_name: string
  key_message_full: string
  key_message_short: string
  benefit_description: string
  rtb: string
  disclaimer: string
  certification: string
  remark: string
}

export interface MessageMatrixCategory {
  number: string
  name: string
  key_message: string
  usps: MessageMatrixUSP[]
}

export interface MessageMatrixProduct {
  product_name: string
  sub_name: string
  head_message: string
  description: string
  categories: MessageMatrixCategory[]
}

/* Health */
export interface HealthResponse {
  status: string
}
