/* ---------- Campaign Brief ---------- */

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

/* ---------- Analysis Report (10 fields) ---------- */

export interface BriefSummary {
  objective: string
  coreChallenge: string
  aiDirection: string
  toneRole?: string
}

export interface AnalysisPersona {
  name: string
  avatar?: string
  belief?: string
  painPoint?: string
  frustration?: string
  motivation?: string
  purchaseTrigger?: string
  emotionalTriggerWords?: string[]
}

export interface BrandFit {
  score: number
  functionalFit?: string
  positiveSignals?: string
  emotionalFit?: string
  culturalFit?: string
}

export interface MarketAnalysisData {
  opportunityGap: string
  riskKeyword: string
  untappedKeywords?: string[]
}

export interface CompetitiveKeyword {
  word: string
  count: number
}

export interface CategoryNarrative {
  oldNarrative?: string
  newNarrative?: string
}

export interface CulturalTension {
  tensions?: string[]
}

export interface CopyImplications {
  doList?: string[]
  dontList?: string[]
}

export interface AnalysisReport {
  briefSummary: BriefSummary
  persona: AnalysisPersona
  brandFit: BrandFit
  marketAnalysis: MarketAnalysisData
  competitiveKeywords: CompetitiveKeyword[]
  categoryNarrative: CategoryNarrative
  emotionalJTBD: string
  culturalTension: CulturalTension
  copyImplications: CopyImplications
  recommendedKeywords: string[]
}

export interface AnalyzeRequest extends CampaignBrief {
  message_matrix?: Record<string, unknown> | null
  locale?: 'ko' | 'en' | 'de'
}

export interface AnalysisResponse {
  status: string
  message: string
  data?: AnalysisReport | null
}

/* ---------- Generate Brief (AI auto-fill) ---------- */

export interface GenerateBriefRequest {
  projectName: string
  projectContext: string
}

export interface GenerateBriefResponse {
  status: string
  data: Partial<CampaignBrief>
}

/* ---------- Strategic Message ---------- */

export interface StrategicMessageData {
  coreMessage: string
  messagePillars: Array<{ title: string; description: string }>
  emotionalHook: string
  toneDirection: string
  keyPhrases: string[]
}

export interface StrategicMessageRequest {
  brief: CampaignBrief
  analysisReport: AnalysisReport
  locale?: 'ko' | 'en' | 'de'
}

export interface StrategicMessageResponse {
  status: string
  data?: StrategicMessageData | null
}

/* ---------- Copy Generation ---------- */

export interface CopyItem {
  headline: string
  subheadline: string
  bodyCopy: string
  cta: string
  methodology?: string
  culturalNotes?: string
  toneAnalysis?: string
}

export interface CopyResult {
  countryCode: string
  copies: CopyItem[]
}

export interface GenerationConfig {
  countries: string[]
  ageGroups: string[]
  personas: string[]
  skillsets: string[]
  copyCount: number
}

export interface GenerateCopyRequest {
  brief: CampaignBrief
  analysisReport: AnalysisReport
  strategicMessage: StrategicMessageData
  config: GenerationConfig
}

export interface GenerateCopyResponse {
  status: string
  data?: CopyResult[] | null
}

/* ---------- Chat ---------- */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  currentStep?: number
  context?: Record<string, unknown>
}

export interface ChatResponse {
  reply: string
}

/* ---------- Review / HITL ---------- */

export interface SelectedCopy {
  key: string
  countryCode: string
  copyData: CopyItem
}

export interface ReviewRequest {
  brief: CampaignBrief
  analysisReport: AnalysisReport
  strategicMessage: StrategicMessageData
  selectedCopies: SelectedCopy[]
  enabledSkills: string[]
}

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

export interface ReviewSessionResponse {
  id: string
  project_name: string
  status: string
  enabled_skills: string[]
  created_at: string
  completed_at?: string | null
  results?: ReviewResult[] | null
}

export interface ReviewHistoryResponse {
  sessions: ReviewSessionResponse[]
}

export interface CorrectionRequest {
  copyKey: string
  copyData: CopyItem
  improvements: Array<{ skillId: string; text: string }>
}

export interface CorrectionResponse {
  headline: string
  subheadline: string
  bodyCopy: string
  cta: string
}

/* ---------- Dashboard ---------- */

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

/* ---------- Skills ---------- */

export interface Skill {
  id: string
  label: string
  description: string
  category: string
  /** 'skillmd' = SKILL.md 기반 내장 스킬, 'custom' = DB에 저장된 사용자 스킬 */
  type: 'skillmd' | 'custom'
  editable: boolean
  skill_type?: string
  action_tags?: string[]
  role_tags?: string[]
  risk_level?: string
  prompt_template?: string
  output_schema?: Record<string, unknown>
  reference_docs?: string[]
  is_active?: boolean
}

export interface SkillListResponse {
  skills: Skill[]
}

export interface SkillDraftRequest {
  name: string
  purpose: string
  goal: string
  goodExample?: string
  badExample?: string
}

export interface SkillDraftResponse {
  draft: CustomSkillCreate
}

export interface CustomSkillCreate {
  id: string
  label: string
  description: string
  category: string
  prompt_template: string
  reference_docs?: string[] | null
  output_schema?: Record<string, unknown> | null
}

export interface CustomSkillUpdate {
  label?: string
  description?: string
  category?: string
  prompt_template?: string
  reference_docs?: string[] | null
  output_schema?: Record<string, unknown> | null
  is_active?: boolean
}

/* ---------- Personas / Culture ---------- */

export interface AIPersona {
  id: string
  name: string
  avatar: string
  color: string
  tags: string[]
  temperature: number
}

export interface CultureProfile {
  id: string
  description: string
  country_code: string
}

/* ---------- Message Matrix ---------- */

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

export interface MessageMatrixParseResponse {
  results: Record<string, MessageMatrixProduct>
}

export interface MessageMatrixSheetsResponse {
  sheets: string[]
}

/* ---------- Campaign Save / Load ---------- */

export interface CampaignSaveRequest {
  brief: CampaignBrief
  analysisReport?: AnalysisReport | null
  strategicMessage?: StrategicMessageData | null
  copyResults?: CopyResult[] | null
  reviewSummary?: ReviewSummary | null
  reviewResults?: ReviewResult[] | null
  copyCandidates?: Record<string, unknown> | null
  currentStep?: number
}

export interface CampaignSaveResponse {
  id: string
  projectName: string
  status: string
  currentStep: number
}

export interface CampaignDetail {
  id: string
  projectName: string
  brief: CampaignBrief
  analysisReport: AnalysisReport | null
  strategicMessage: StrategicMessageData | null
  copyResults: CopyResult[] | null
  reviewSummary: ReviewSummary | null
  reviewResults: ReviewResult[] | null
  copyCandidates: Record<string, unknown> | null
  targetCountries: string[] | null
  brandFitScore: number | null
  reviewAvgScore: number | null
  totalCopies: number | null
  currentStep: number
  status: 'draft' | 'completed'
  createdAt: string | null
}

export interface CampaignDeleteResponse {
  status: string
  id: string
}

/* ---------- Health ---------- */

export interface HealthResponse {
  status: string
}
