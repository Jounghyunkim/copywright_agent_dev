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
  }>
}

/* Review */
export interface ReviewResult {
  type: 'skill_completed'
  skillId: string
  skillName: string
  copyKey: string
  score: number
  passed: boolean
  feedback: string
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
}

export interface DashboardData {
  stats: DashboardStats
  campaigns: CampaignListItem[]
}

/* Skill */
export interface Skill {
  id: string
  name: string
  label?: string
  description: string
  category?: string
  type: 'builtin' | 'custom'
  prompt_template?: string
  output_schema?: Record<string, unknown>
  is_active?: boolean
  createdAt?: string
  updatedAt?: string
}

/* Health */
export interface HealthResponse {
  status: string
}
