import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Send, Bot, Loader, ChevronDown, ChevronRight, FileText, BarChart2,
  MessageSquareText, Globe, Sparkles, CheckCircle, XCircle, Zap,
  ClipboardCheck, Search, Check, FlaskConical,
} from 'lucide-react'
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { ProcessingModal } from '@/shared/ui/processing-modal'
import { Markdown } from '@/shared/ui/markdown'
import { useUIStore } from '@/shared/state/ui-store'
import { readSSE, apiClient } from '@/shared/api/client'
import { useT } from '@/shared/i18n/useTranslation'
import type {
  CampaignBrief, AnalysisReport, StrategicMessageData,
  CopyResult, ReviewResult, ReviewSummary,
  CopyCandidateResult, CopyCandidate,
} from '@/shared/api/types'

// Lazy-import existing JSX components that still live in components/
// These are kept as-is from the old codebase, just re-exported
import BriefingForm, { PreviewBody } from '@/components/BriefingForm'
import MessageMatrixUpload from '@/components/MessageMatrixUpload'
import MessageMatrixEditor from '@/components/MessageMatrixEditor'
import MessageMatrixPreviewModal from '@/components/MessageMatrixPreviewModal'
import AnalysisReportView from '@/components/AnalysisReport'
import StrategicMessage from '@/components/StrategicMessage'
import CopyResults from '@/components/CopyResults'
import GenerationConfig from '@/components/GenerationConfig'
import {
  InitialView, ResultView, StrategicMessageView,
  GenerationConfigView, CopyResultsView, ReviewView, ReviewResultsView,
} from '@/components/EditorViews'

/* ──────────────────── Step Wizard Config ──────────────────── */
type Step = 1 | 2 | 3 | 4 | 5
const STEP_LABELS = ['Research', 'Analysis', 'Copywriting Strategy', 'Generation', 'Review']
const STEP_ICONS = [FileText, Search, MessageSquareText, Zap, ClipboardCheck]


/* ──────────────────── Action config (timeline) ──────────────────── */
const ACTION_CONFIG: Record<string, { icon: typeof Zap; label: string; color: string }> = {
  'matrix-upload': { icon: FileText, label: 'Message Matrix Upload', color: '#2563EB' },
  'matrix-parse': { icon: Search, label: 'Message Matrix Parsing', color: '#2563EB' },
  'brief-auto-generate': { icon: Sparkles, label: 'AI Research Auto-generation', color: '#7C3AED' },
  'submit-brief': { icon: FileText, label: 'Submit Research & Start Analysis', color: 'var(--color-primary)' },
  'approve-analysis': { icon: CheckCircle, label: 'Approve Analysis', color: '#059669' },
  'strategic-message-extract': { icon: MessageSquareText, label: 'Copywriting Strategy Extraction', color: '#2563EB' },
  'approve-strategic': { icon: CheckCircle, label: 'Approve Copywriting Strategy', color: '#059669' },
  'generate-copy': { icon: Zap, label: 'Generate Copy', color: '#D97706' },
  'start-review': { icon: ClipboardCheck, label: 'Start Review', color: '#7C3AED' },
  'submit-review': { icon: ClipboardCheck, label: 'Skillset Review', color: 'var(--color-primary)' },
  'save-campaign': { icon: CheckCircle, label: 'Save Campaign', color: '#059669' },
  'modify-brief': { icon: FileText, label: 'Modify Research', color: 'var(--color-error)' },
}

const STATUS_COLORS = {
  started: { bg: 'var(--color-info-bg)', border: 'var(--color-info-border)', text: 'var(--color-info-text)', label: 'In progress...' },
  completed: { bg: 'var(--color-success-bg)', border: 'var(--color-success-border)', text: 'var(--color-success-text)', label: 'Done' },
  failed: { bg: 'var(--color-error-bg)', border: 'var(--color-error-border)', text: 'var(--color-error-text)', label: 'Failed' },
}

type TimelineItem = {
  type: string
  action?: string
  status?: string
  detail?: string
  content?: string
  _actionId?: string
}

/* ──────────────────── Collapsible Section ──────────────────── */
function CollapsibleSection({ icon, title, badge, collapsed, onToggle, children }: {
  icon: React.ReactNode; title: string; badge?: string; collapsed: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
      <div onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '1rem 1.5rem', cursor: 'pointer', userSelect: 'none',
      }}>
        {collapsed ? <ChevronRight size={16} color="var(--color-text-secondary)" /> : <ChevronDown size={16} color="var(--color-text-secondary)" />}
        {icon}
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{title}</span>
        {badge && <Badge variant="success" style={{ marginLeft: 'auto' }}>{badge}</Badge>}
      </div>
      {!collapsed && children}
    </div>
  )
}

/* ──────────────────── Action Status Bubble ──────────────────── */
function ActionStatusBubble({ item }: { item: TimelineItem }) {
  const config = ACTION_CONFIG[item.action || ''] || { icon: Zap, label: item.action || '', color: 'var(--color-text-secondary)' }
  const status = STATUS_COLORS[(item.status as keyof typeof STATUS_COLORS) || 'started']
  const IconComp = config.icon
  const isLoading = item.status === 'started'

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', maxWidth: '85%' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--radius-lg)',
        background: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', flexShrink: 0, boxShadow: `0 4px 10px ${config.color}33`,
      }}>
        <IconComp size={18} />
      </div>
      <div style={{
        background: 'var(--color-surface)', padding: '10px 16px',
        borderRadius: '18px', borderTopLeftRadius: 4,
        boxShadow: 'var(--shadow-sm)', fontSize: '0.88rem', lineHeight: 1.6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: item.detail ? 4 : 0 }}>
          {isLoading ? (
            <Loader size={13} color={status.text} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          ) : item.status === 'completed' ? (
            <CheckCircle size={13} color={status.text} style={{ flexShrink: 0 }} />
          ) : (
            <XCircle size={13} color={status.text} style={{ flexShrink: 0 }} />
          )}
          <span style={{ fontWeight: 700 }}>{config.label}</span>
          <span style={{
            fontSize: '0.68rem', fontWeight: 600, padding: '1px 6px', borderRadius: 4,
            background: status.bg, color: status.text, border: `1px solid ${status.border}`,
          }}>{status.label}</span>
        </div>
        {item.detail && <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{item.detail}</div>}
      </div>
    </div>
  )
}

/* ──────────────────── Step Progress Bar ──────────────────── */
const STEP_DESCS = ['Research input', 'Market research', 'Copy strategy', 'Copy creation', 'Final approval']

const STEP_GROUPS = [
  { label: 'Research & Strategy', steps: [0, 1, 2] },  // Step 1, 2, 3
  { label: 'Creation & Review', steps: [3, 4] },        // Step 4, 5
]

function StepProgressBar({ step, reviewCompleted, onStepClick }: { step: Step; reviewCompleted: boolean; onStepClick?: (s: Step) => void }) {
  const getStepColor = (done: boolean, active: boolean) => {
    if (done) return '#22C55E'
    if (active) return '#A50034'
    return '#D1D5DB'
  }

  const renderStep = (i: number) => {
    const s = (i + 1) as Step
    const done = step > s || (s === 5 && reviewCompleted)
    const active = step === s && !reviewCompleted
    const Icon = STEP_ICONS[i]
    const color = getStepColor(done, active)
    const clickable = done || active

    return (
      <div
        key={i}
        onClick={() => { if (clickable && onStepClick) onStepClick(s) }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', borderRadius: 10,
          backgroundColor: active ? '#FFF0F3' : done ? '#F0FFF4' : 'transparent',
          transition: 'all 0.3s ease',
          cursor: clickable ? 'pointer' : 'default',
        }}
      >
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            backgroundColor: done ? '#22C55E' : active ? '#A50034' : '#F3F4F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: done || active ? '#fff' : '#9CA3AF',
            transition: 'all 0.3s ease',
            flexShrink: 0,
            boxShadow: active ? '0 3px 10px rgba(165, 0, 52, 0.2)' : done ? '0 3px 10px rgba(52, 199, 89, 0.2)' : 'none',
          }}>
            {done ? <Check size={14} strokeWidth={3} /> : <Icon size={13} />}
          </div>
          <div style={{
            position: 'absolute', top: -2, right: -3,
            width: 13, height: 13, borderRadius: '50%',
            backgroundColor: '#fff', color,
            fontSize: '0.5rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1.5px solid ${color}`,
          }}>{s}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const }}>
          <span style={{
            fontSize: '0.78rem', fontWeight: active ? 700 : 600,
            color: active ? '#A50034' : done ? '#22C55E' : 'var(--color-text)',
            lineHeight: 1.2, transition: 'color 0.3s ease',
          }}>{STEP_LABELS[i]}</span>
          <span style={{
            fontSize: '0.62rem',
            color: active ? 'rgba(165, 0, 52, 0.6)' : done ? 'rgba(52, 199, 89, 0.7)' : 'var(--color-text-secondary)',
            lineHeight: 1.2, marginTop: 1, transition: 'color 0.3s ease',
          }}>{STEP_DESCS[i]}</span>
        </div>
      </div>
    )
  }

  return (
    <nav style={{
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      borderBottom: '1px solid var(--color-border)',
      height: 72,
      gap: 12,
    }}>
      {STEP_GROUPS.map((group, gi) => {
        const groupSteps = group.steps
        const allDone = groupSteps.every((i) => step > (i + 1) || ((i + 1) === 5 && reviewCompleted))
        const hasActive = groupSteps.some((i) => step === (i + 1) && !reviewCompleted)

        return (
          <div key={gi} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 10px',
              borderRadius: 14,
              border: `1.5px dashed ${allDone ? '#22C55E' : hasActive ? '#A50034' : 'var(--color-border)'}`,
              backgroundColor: allDone ? '#F0FDF4' : hasActive ? '#FFFBFB' : 'transparent',
              transition: 'all 0.3s ease',
              position: 'relative' as const,
            }}>
              {/* Group label */}
              <span style={{
                position: 'absolute', top: -8, left: 12,
                fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.3px',
                textTransform: 'uppercase' as const,
                color: allDone ? '#16A34A' : hasActive ? '#A50034' : 'var(--color-text-secondary)',
                backgroundColor: '#fff',
                padding: '0 4px',
              }}>{group.label}</span>

              {groupSteps.map((stepIdx, si) => {
                const stepDone = step > (stepIdx + 1) || ((stepIdx + 1) === 5 && reviewCompleted)
                return (
                  <div key={stepIdx} style={{ display: 'flex', alignItems: 'center' }}>
                    {renderStep(stepIdx)}
                    {si < groupSteps.length - 1 && (
                      <div style={{
                        width: 16, height: 1.5, borderRadius: 1,
                        backgroundColor: stepDone ? '#22C55E' : 'var(--color-border)',
                        margin: '0 2px',
                        transition: 'background-color 0.3s ease',
                      }} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Connector between groups */}
            {gi < STEP_GROUPS.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, flexShrink: 0 }}>
                <div style={{
                  width: 14, height: 1.5, borderRadius: 1,
                  backgroundColor: allDone ? '#22C55E' : 'var(--color-border)',
                  transition: 'background-color 0.3s ease',
                }} />
                <ChevronRight size={14} style={{
                  color: allDone ? '#22C55E' : '#D1D5DB',
                  transition: 'color 0.3s ease',
                }} />
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

/* ──────────────────── Main Page ──────────────────── */
const MIN_PANEL_WIDTH = 320

interface NewWorkflowPageProps {
  campaignId?: string
  campaignData?: Record<string, unknown>
}

export function NewWorkflowPage({ campaignId, campaignData }: NewWorkflowPageProps) {
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)
  const locale = useUIStore((s) => s.locale)
  const t = useT()
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed)

  // 페이지 진입 시 사이드바 접기
  useEffect(() => {
    setSidebarCollapsed(true)
  }, [])

  // Step state
  const [step, setStep] = useState<Step>(1)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisReport | null>(null)
  const [isApproved, setIsApproved] = useState(false)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [leftRatio, setLeftRatio] = useState(0.4)
  const [isDragging, setIsDragging] = useState(false)
  const [submittedBrief, setSubmittedBrief] = useState<CampaignBrief | null>(null)
  const [isBriefCollapsed, setIsBriefCollapsed] = useState(true)
  const [isReportCollapsed, setIsReportCollapsed] = useState(false)
  const [isStrategicCollapsed, setIsStrategicCollapsed] = useState(false)
  const [strategicData, setStrategicData] = useState<StrategicMessageData | null>(null)
  const [isStrategicLoading, setIsStrategicLoading] = useState(false)
  const [isStrategicApproved, setIsStrategicApproved] = useState(false)
  const [copyResults, setCopyResults] = useState<CopyResult[] | null>(null)
  const [copyCandidates, setCopyCandidates] = useState<CopyCandidateResult | null>(null)
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopyResultsCollapsed, setIsCopyResultsCollapsed] = useState(false)
  const [reviewSkills, setReviewSkills] = useState([
    'regulatory-copy-validation',
    'brand-lexicon-check',
    'copy-scorecard-generator',
    'compliance-redflag-detector',
    'lg-brand-fit-check',
  ])
  const [selectedCopies, setSelectedCopies] = useState<Set<string>>(new Set())
  const [analysisProgress, setAnalysisProgress] = useState<string[]>([])
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewResults, setReviewResults] = useState<ReviewResult[] | null>(null)
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)
  const [availableSkills, setAvailableSkills] = useState<unknown[] | null>(null)
  const [aiPersonas, setAiPersonas] = useState<unknown[] | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(campaignId || null)
  const [matrixData, setMatrixData] = useState<Record<string, unknown> | null>(null)
  const [matrixSectionOpen, setMatrixSectionOpen] = useState(true)
  const [sampleLoading, setSampleLoading] = useState(false)
  const [briefSectionOpen, setBriefSectionOpen] = useState(true)
  const [showMatrixPreview, setShowMatrixPreview] = useState(false)
  const [briefFormData, setBriefFormData] = useState<Record<string, string> | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mainAreaRef = useRef<HTMLDivElement>(null)

  const addToTimeline = useCallback((item: TimelineItem) => {
    setTimeline((prev) => [...prev, item])
  }, [])

  const addAction = useCallback((action: string, status: string, detail?: string) => {
    setTimeline((prev) => {
      if (status === 'started') {
        return [...prev, { type: 'action-status', action, status, detail, _actionId: `${action}-${Date.now()}` }]
      }
      const idx = [...prev].reverse().findIndex(
        (it) => it.type === 'action-status' && it.action === action && it.status === 'started'
      )
      if (idx >= 0) {
        const realIdx = prev.length - 1 - idx
        const updated = [...prev]
        updated[realIdx] = { ...updated[realIdx], status, detail }
        return updated
      }
      return [...prev, { type: 'action-status', action, status, detail }]
    })
  }, [])

  const handleActionNotify = useCallback(({ action, status, detail }: { action: string; status: string; detail?: string }) => {
    addAction(action, status, detail)
  }, [addAction])

  const handleLoadSampleMatrix = useCallback(async () => {
    setSampleLoading(true)
    handleActionNotify({ action: 'matrix-upload', status: 'started', detail: t('wf.sampleLoading') })
    try {
      const data = await apiClient.get<{ results: Record<string, unknown> }>('/api/v1/message-matrix/sample')
      setMatrixData(data.results)
      handleActionNotify({ action: 'matrix-parse', status: 'completed', detail: t('wf.sampleDone') })
    } catch (err) {
      handleActionNotify({ action: 'matrix-upload', status: 'failed', detail: `샘플 로드 실패: ${err}` })
    } finally {
      setSampleLoading(false)
    }
  }, [handleActionNotify])

  // Auto-scroll timeline
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [timeline, isAnalyzing, isStrategicLoading, isChatLoading, isGenerating, isReviewing])

  // Drag resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e: MouseEvent) => {
      const container = mainAreaRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const ratio = Math.max(MIN_PANEL_WIDTH / rect.width, Math.min(x / rect.width, 1 - MIN_PANEL_WIDTH / rect.width))
      setLeftRatio(ratio)
    }
    const handleMouseUp = () => setIsDragging(false)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  // Load skills + personas
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || ''
        const res = await fetch(`${apiBase}/api/v1/skills`)
        if (res.ok) {
          const data = await res.json()
          setAvailableSkills(data.skills)
        }
      } catch (e) {
        console.error('Failed to load skills:', e)
      }
    }
    const fetchPersonas = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || ''
        const res = await fetch(`${apiBase}/api/v1/personas`)
        if (res.ok) {
          const data = await res.json()
          setAiPersonas(data.data || [])
        }
      } catch (e) {
        console.error('Failed to load AI personas:', e)
      }
    }
    fetchSkills()
    fetchPersonas()
  }, [])

  // Load existing campaign
  useEffect(() => {
    if (!campaignData) return
    const d = campaignData as Record<string, unknown>
    const loadedStep = (d.currentStep as number) || 5

    // 저장된 데이터 복원
    setSubmittedBrief(d.brief as CampaignBrief)
    if (d.analysisReport) setAnalysisResult(d.analysisReport as AnalysisReport)
    if (d.strategicMessage) setStrategicData(d.strategicMessage as StrategicMessageData)
    if (d.copyResults) setCopyResults(d.copyResults as CopyResult[])
    if (d.copyCandidates) setCopyCandidates(d.copyCandidates as CopyCandidateResult)
    if (d.reviewResults && (d.reviewResults as unknown[]).length > 0) {
      setReviewResults(d.reviewResults as ReviewResult[])
    }
    if (d.reviewSummary) setReviewSummary(d.reviewSummary as ReviewSummary)

    // 단계별 상태 복원
    if (loadedStep >= 2) setIsApproved(true)
    if (loadedStep >= 4) setIsStrategicApproved(true)
    setIsBriefCollapsed(true)
    setMatrixSectionOpen(false)
    setIsReportCollapsed(loadedStep > 2)
    setIsStrategicCollapsed(loadedStep > 3)
    setIsCopyResultsCollapsed(loadedStep > 4)

    // 카피 선택 복원
    if (d.copyResults) {
      const allKeys = new Set<string>();
      ((d.copyResults as CopyResult[]) || []).forEach((r) => {
        const copies = r.copies || [r]
        copies.forEach((_, idx) => allKeys.add(`${r.countryCode}-${idx}`))
      })
      setSelectedCopies(allKeys)
    }

    // 타임라인 복원 — 현재 단계까지만
    const tl: TimelineItem[] = []
    if (loadedStep >= 2) tl.push({ type: 'analysis-result' })
    if (loadedStep >= 3) tl.push({ type: 'strategic-message' })
    if (loadedStep >= 4) {
      tl.push({ type: 'generation-config' })
      if (d.copyResults) tl.push({ type: 'copy-results' })
    }
    tl.push({ type: 'action-status', action: 'resume-campaign', status: 'completed', detail: `Campaign "${d.projectName}" resumed at Step ${loadedStep}` })
    if (loadedStep >= 5) {
      tl.push({ type: 'review' })
      if ((d.reviewResults as unknown[])?.length) tl.push({ type: 'review-results' })
    }
    setTimeline(tl)
    setStep(loadedStep as Step)
  }, [campaignData])

  /* ── Handlers ── */
  const handleStartAnalysis = async (formData: CampaignBrief) => {
    setSubmittedBrief(formData)
    setIsAnalyzing(true)
    setAnalysisResult(null)
    setIsApproved(false)
    setAnalysisProgress([])
    addAction('submit-brief', 'started', `Project: ${formData.projectName}`)

    const payload = matrixData
      ? { ...formData, message_matrix: matrixData, locale }
      : { ...formData, locale }

    try {
      await readSSE('/api/v1/campaigns/analyze', payload, (event) => {
        if (event.type === 'result') {
          setAnalysisResult(event.data as AnalysisReport)
          addAction('submit-brief', 'completed', 'Market Analyst Report generated')
          addToTimeline({ type: 'analysis-result' })
          setStep(2)
          // Auto-save at step 2 — pass analysisReport directly
          autoSave(2, { analysisReport: event.data })
        } else if (event.type === 'error') {
          throw new Error(event.message as string)
        }
      })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      addAction('submit-brief', 'failed', msg)
      addToast('Analysis failed. Check backend.', 'error')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApprove = async () => {
    setIsApproved(true)
    setStep(3)
    setIsBriefCollapsed(true)
    setMatrixSectionOpen(false)
    setIsReportCollapsed(true)
    addAction('approve-analysis', 'completed', 'Market Analyst Report approved')
    addAction('strategic-message-extract', 'started', 'Extracting strategic message...')
    addToTimeline({ type: 'strategic-message' })
    setIsStrategicLoading(true)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || ''
      const res = await fetch(`${apiBase}/api/v1/campaigns/strategic-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: submittedBrief, analysisReport: analysisResult, locale }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      setStrategicData(result.data)
      addAction('strategic-message-extract', 'completed', 'Core Message + Message Pillars extracted')
      // Auto-save at step 3 — pass strategicMessage directly
      autoSave(3, { strategicMessage: result.data })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      addAction('strategic-message-extract', 'failed', msg)
      addToast('Strategic message extraction failed.', 'error')
    } finally {
      setIsStrategicLoading(false)
    }
  }

  const handleModify = () => {
    addAction('modify-brief', 'completed', 'Returning to Step 1 for research modification')
    setAnalysisResult(null)
    // submittedBrief, matrixData, briefFormData 는 보존하여 수정 가능하도록 함
    setStrategicData(null)
    setIsBriefCollapsed(true)
    setMatrixSectionOpen(false)
    setIsStrategicApproved(false)
    setIsApproved(false)
    setAnalysisProgress([])
    setTimeline((prev) => prev.filter(
      (item) => item.type !== 'analysis-result'
        && item.type !== 'strategic-message'
        && item.type !== 'generation-config'
        && item.type !== 'copy-results'
        && item.type !== 'review'
        && item.type !== 'review-results'
    ))
    setStep(1)
  }

  const handleModifyStrategic = () => {
    setStrategicData(null)
    setIsStrategicApproved(false)
    setIsApproved(false)
    setTimeline((prev) => {
      const idx = prev.findIndex((item) => item.type === 'strategic-message')
      return idx >= 0 ? prev.slice(0, idx) : prev
    })
    setStep(2)
  }

  const handleApproveStrategic = () => {
    setIsStrategicApproved(true)
    setIsBriefCollapsed(true)
    setMatrixSectionOpen(false)
    setIsReportCollapsed(true)
    setIsStrategicCollapsed(true)
    addAction('approve-strategic', 'completed', 'Copywriting Strategy approved')
    addToTimeline({ type: 'generation-config' })
    setStep(4)
  }

  const handleSubmitGeneration = async (config: { countries: string[]; ageGroups: string[]; personas: string[]; skillsets: string[]; copyCount: number; usePersonaMode?: boolean; selectedWriters?: string[] }) => {
    setIsGenerating(true)
    setCopyResults(null)
    setCopyCandidates(null)
    setSelectedCandidateIdx(0)

    const isPersonaMode = config.usePersonaMode && (config.selectedWriters || []).length > 0
    const endpoint = isPersonaMode ? '/api/v1/campaigns/generate-copy-candidates' : '/api/v1/campaigns/generate-copy'
    const modeLabel = isPersonaMode ? `Persona mode (${(config.selectedWriters || []).length} writers)` : 'Standard mode'
    addAction('generate-copy', 'started', `${config.countries.length} countries x ${config.copyCount} variants — ${modeLabel}`)

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || ''
      const res = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: submittedBrief, analysisReport: analysisResult,
          strategicMessage: strategicData, config,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()

      if (isPersonaMode && result.data?.candidates) {
        // 페르소나 후보 모드: candidates 저장 + 첫 번째 후보를 기본 copyResults로 설정
        setCopyCandidates(result.data)
        const firstCandidate = result.data.candidates[0]
        if (firstCandidate) {
          setCopyResults(firstCandidate.copies)
          setSelectedCandidateIdx(0)
        }
        const totalCandidates = result.data.candidates.length
        addAction('generate-copy', 'completed', `${totalCandidates} persona candidates generated`)
      } else {
        // 표준 모드: 기존과 동일
        setCopyResults(result.data)
        const totalCopies = (result.data || []).reduce((s: number, r: CopyResult) => s + (r.copies?.length || 1), 0)
        addAction('generate-copy', 'completed', `${totalCopies} copies generated`)
      }
      addToTimeline({ type: 'copy-results' })
      // Auto-save at step 4 — pass copy data directly
      if (isPersonaMode && result.data?.candidates) {
        autoSave(4, { copyResults: result.data.candidates[0]?.copies, copyCandidates: result.data })
      } else {
        autoSave(4, { copyResults: result.data })
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      addAction('generate-copy', 'failed', msg)
      addToast('Copy generation failed.', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReview = () => {
    const allKeys = new Set<string>()
    if (copyResults) {
      copyResults.forEach((r) => {
        const copies = r.copies || [r]
        copies.forEach((_, idx) => allKeys.add(`${r.countryCode}-${idx}`))
      })
    }
    setSelectedCopies(allKeys)
    addAction('start-review', 'completed', `${allKeys.size} copies selected`)
    addToTimeline({ type: 'review' })
    setIsBriefCollapsed(true)
    setMatrixSectionOpen(false)
    setIsReportCollapsed(true)
    setIsStrategicCollapsed(true)
    setIsCopyResultsCollapsed(true)
    setStep(5)
  }

  const handleSubmitReview = async () => {
    if (!copyResults || selectedCopies.size === 0 || reviewSkills.length === 0) return
    setIsReviewing(true)
    setReviewResults([])
    setReviewSummary(null)
    setTimeline((prev) => prev.filter(
      (item) => item.type !== 'review-results' && !(item.type === 'action-status' && item.action === 'submit-review')
    ))
    addAction('submit-review', 'started', `${selectedCopies.size} copies x ${reviewSkills.length} skills`)
    addToTimeline({ type: 'review-results' })

    const copiesPayload: Array<{ key: string; countryCode: string; copyData: unknown }> = []
    copyResults.forEach((r) => {
      const copies = r.copies || [r]
      copies.forEach((copy, idx) => {
        const key = `${r.countryCode}-${idx}`
        if (selectedCopies.has(key)) copiesPayload.push({ key, countryCode: r.countryCode, copyData: copy })
      })
    })

    try {
      await readSSE('/api/v1/campaigns/review', {
        brief: submittedBrief, analysisReport: analysisResult,
        strategicMessage: strategicData, selectedCopies: copiesPayload,
        enabledSkills: reviewSkills,
      }, (event) => {
        if (event.type === 'skill_completed') {
          setReviewResults((prev) => [...(prev || []), event as unknown as ReviewResult])
        } else if (event.type === 'review_done') {
          const summary = (event as Record<string, unknown>).summary as ReviewSummary
          setReviewSummary(summary)
          setIsReviewing(false)
          addAction('submit-review', 'completed', `Avg Score: ${summary?.avgScore} (${summary?.passed}/${summary?.total} Pass)`)
          // Auto-save at step 5 — pass reviewSummary directly
          autoSave(5, { reviewSummary: summary })
        }
      })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      addAction('submit-review', 'failed', msg)
      addToast('Review failed.', 'error')
    } finally {
      setIsReviewing(false)
    }
  }

  const handleCorrectCopy = async (copyKey: string, copyInfo: Record<string, unknown>, improvements: Array<{ skillId: string; text: string }>) => {
    const result = await apiClient.post<{ headline: string; subheadline: string; bodyCopy: string; cta: string }>(
      '/api/v1/campaigns/correct',
      { copyKey, copyData: copyInfo, improvements },
    )
    return result
  }

  const handleUpdateAndReReview = async (copyKey: string, correctedCopy: Record<string, string>) => {
    const [countryCode] = copyKey.split('-')
    const copyIdx = Number(copyKey.split('-')[1])

    // 1. 현재 copyResults에서 원본 카피를 찾아 corrected 내용으로 merge
    let updatedCopyData: Record<string, unknown> | null = null
    if (copyResults) {
      for (const r of copyResults) {
        if (r.countryCode !== countryCode) continue
        const copies = (r.copies || [r]) as Array<Record<string, unknown>>
        if (copies[copyIdx]) {
          updatedCopyData = { ...copies[copyIdx], ...correctedCopy }
        }
      }
    }
    if (!updatedCopyData) return null

    // 2. copyResults 상태도 업데이트 (UI 반영용)
    setCopyResults((prev) => {
      if (!prev) return prev
      return prev.map((r) => {
        if (r.countryCode !== countryCode) return r
        const copies = (r.copies || [r]) as Array<Record<string, unknown>>
        const updatedCopies = copies.map((copy, idx) =>
          idx === copyIdx ? { ...copy, ...correctedCopy } : copy
        )
        return { ...r, copies: updatedCopies }
      }) as typeof prev
    })

    // 3. corrected copy 데이터로 재평가 요청
    const copiesPayload = [{ key: copyKey, countryCode, copyData: updatedCopyData }]
    const reResults: Array<Record<string, unknown>> = []

    let reReviewDone = false
    try {
      await readSSE('/api/v1/campaigns/review', {
        brief: submittedBrief,
        analysisReport: analysisResult,
        strategicMessage: strategicData,
        selectedCopies: copiesPayload,
        enabledSkills: reviewSkills,
      }, (event) => {
        if (event.type === 'skill_completed') {
          reResults.push(event as Record<string, unknown>)
          setReviewResults((prev) => {
            const filtered = (prev || []).filter((r) => (r as unknown as Record<string, unknown>).targetCopyKey !== copyKey)
            return [...filtered, event as unknown as ReviewResult]
          })
        } else if (event.type === 'review_done') {
          reReviewDone = true
          // reviewSummary 즉시 재계산
          setReviewResults((prev) => {
            if (!prev) return prev
            const all = prev as unknown as Array<Record<string, unknown>>
            const total = all.length
            const passed = all.filter((r) => r.passed).length
            const avgScore = total > 0 ? Math.round(all.reduce((s, r) => s + (r.score as number), 0) / total) : 0
            setReviewSummary({ total, passed, failed: total - passed, avgScore } as ReviewSummary)
            return prev
          })
        }
      })
    } catch {
      // ignore
    }

    // Fallback: SSE 스트림에서 review_done을 못 받았으면 직접 재계산
    if (!reReviewDone) {
      setReviewResults((prev) => {
        if (!prev) return prev
        const all = prev as unknown as Array<Record<string, unknown>>
        const total = all.length
        const passed = all.filter((r) => r.passed).length
        const avgScore = total > 0 ? Math.round(all.reduce((s, r) => s + (r.score as number), 0) / total) : 0
        setReviewSummary({ total, passed, failed: total - passed, avgScore } as ReviewSummary)
        return prev
      })
    }

    return reResults
  }

  // ── Auto-save: 각 단계 완료 시 서버에 자동 저장 ──
  // 모든 state를 ref로 추적하여 stale closure 문제를 근본적으로 해결
  const savedIdRef = useRef<string | null>(savedCampaignId)
  savedIdRef.current = savedCampaignId
  const stateRef = useRef({ submittedBrief, analysisResult, strategicData, copyResults, reviewSummary, reviewResults, copyCandidates })
  stateRef.current = { submittedBrief, analysisResult, strategicData, copyResults, reviewSummary, reviewResults, copyCandidates }

  const autoSave = useCallback(async (stepNum: number, overrides: Record<string, unknown> = {}) => {
    // 500ms 딜레이 — React state 반영 + ref 업데이트 대기
    await new Promise((r) => setTimeout(r, 500))
    const s = stateRef.current
    const brief = (overrides.brief ?? s.submittedBrief) as Record<string, unknown> | null
    if (!brief) {
      console.warn('[AutoSave] Skipped — no brief data')
      return
    }
    const payload = {
      brief,
      analysisReport: overrides.analysisReport ?? s.analysisResult,
      strategicMessage: overrides.strategicMessage ?? s.strategicData,
      copyResults: overrides.copyResults ?? s.copyResults,
      reviewSummary: overrides.reviewSummary ?? s.reviewSummary,
      reviewResults: overrides.reviewResults ?? s.reviewResults,
      copyCandidates: overrides.copyCandidates ?? s.copyCandidates,
      currentStep: stepNum,
    }
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || ''
      const curId = savedIdRef.current
      const isUpdate = !!curId
      const url = isUpdate ? `${apiBase}/api/v1/campaigns/${curId}` : `${apiBase}/api/v1/campaigns/save`
      const res = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const result = await res.json()
        if (!curId && result.id) {
          setSavedCampaignId(result.id)
          savedIdRef.current = result.id
        }
        console.log(`[AutoSave] Step ${stepNum} saved (id: ${result.id})`)
      } else {
        console.warn(`[AutoSave] HTTP ${res.status}`)
      }
    } catch (err) {
      console.warn('[AutoSave] Failed:', err)
    }
  }, [])

  // ── Step 클릭으로 해당 단계 결과물로 이동 ──
  const handleStepClick = useCallback((targetStep: Step) => {
    // 모든 섹션 접기
    setIsBriefCollapsed(true)
    setMatrixSectionOpen(false)
    setIsReportCollapsed(true)
    setIsStrategicCollapsed(true)
    setIsCopyResultsCollapsed(true)

    // 클릭한 단계의 해당 섹션만 펼치기
    switch (targetStep) {
      case 1:
        setIsBriefCollapsed(false)
        setMatrixSectionOpen(true)
        break
      case 2:
        setIsReportCollapsed(false)
        break
      case 3:
        setIsStrategicCollapsed(false)
        break
      case 4:
        setIsCopyResultsCollapsed(false)
        break
      case 5:
        // Review — 오른쪽 패널의 타임라인으로 스크롤
        break
    }

    // 왼쪽 패널 최상단으로 스크롤
    const leftPanel = document.querySelector('[data-panel="left"]') as HTMLElement
    if (leftPanel) leftPanel.scrollTop = 0
  }, [])

  const handleSaveExit = async () => {
    setIsSaving(true)
    const isUpdate = !!savedCampaignId
    addAction('save-campaign', 'started', isUpdate ? 'Updating...' : 'Saving...')
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || ''
      const url = isUpdate ? `${apiBase}/api/v1/campaigns/${savedCampaignId}` : `${apiBase}/api/v1/campaigns/save`
      const res = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: submittedBrief, analysisReport: analysisResult,
          strategicMessage: strategicData, copyResults, reviewSummary, reviewResults,
          copyCandidates, currentStep: step,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      addAction('save-campaign', 'completed', `Campaign "${result.projectName}" saved`)
      addToast('Campaign saved successfully.', 'success')
      setTimeout(() => navigate('/'), 500)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      addAction('save-campaign', 'failed', msg)
      addToast('Save failed.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGuideSelect = (guideInfo: { title: string; guide: string }) => {
    addToTimeline({ type: 'chat-assistant', content: `[${guideInfo.title}] Guide\n\n${guideInfo.guide}` })
  }

  const chatPlaceholders: Record<number, string> = {
    1: t('chat.ph.step1'),
    2: t('chat.ph.step2'),
    3: t('chat.ph.step3'),
    4: t('chat.ph.step4'),
    5: t('chat.ph.step5'),
  }

  const buildChatContext = () => {
    const ctx: Record<string, unknown> = {}
    if (submittedBrief) ctx.brief = submittedBrief
    if (analysisResult) ctx.analysisReport = analysisResult
    if (strategicData) ctx.strategicMessage = strategicData
    if (copyResults) ctx.copyResults = copyResults
    if (reviewResults) ctx.reviewResults = reviewResults
    return Object.keys(ctx).length > 0 ? ctx : null
  }

  const handleChatSend = async () => {
    const text = chatInput.trim()
    if (!text || isChatLoading) return
    const chatHistory = [
      ...timeline
        .filter((item) => item.type === 'chat-user' || item.type === 'chat-assistant')
        .map((item) => ({ role: item.type === 'chat-user' ? 'user' : 'assistant', content: item.content! })),
      { role: 'user', content: text },
    ]
    addToTimeline({ type: 'chat-user', content: text })
    setChatInput('')
    setIsChatLoading(true)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || ''
      const res = await fetch(`${apiBase}/api/v1/campaigns/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory, currentStep: step, context: buildChatContext() }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      addToTimeline({ type: 'chat-assistant', content: result.reply })
    } catch {
      addToTimeline({ type: 'chat-assistant', content: 'An error occurred. Please try again.' })
    } finally {
      setIsChatLoading(false)
    }
  }

  const canSend = chatInput.trim().length > 0 && !isChatLoading

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Step Progress */}
      <StepProgressBar step={step} reviewCompleted={!!reviewSummary} onStepClick={handleStepClick} />

      {isDragging && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, cursor: 'col-resize' }} />
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }} ref={mainAreaRef}>
        {/* Left panel */}
        <div style={{
          width: `${leftRatio * 100}%`, flexShrink: 0, overflow: 'hidden',
          borderRight: '1px solid var(--color-border)',
        }}>
          {step > 1 && submittedBrief ? (
            <div data-panel="left" style={{ width: '100%', height: '100%', background: 'var(--color-bg)', overflowY: 'auto' }}>
              {/* Message Matrix */}
              {matrixData && (
                <CollapsibleSection
                  icon={<FileText size={16} color="var(--color-primary)" />}
                  title="Message Matrix" badge="Loaded"
                  collapsed={!matrixSectionOpen} onToggle={() => setMatrixSectionOpen((p) => !p)}
                >
                  <div style={{ padding: '0 1rem 1rem' }}>
                    <MessageMatrixEditor matrixData={matrixData} onChange={(d: Record<string, unknown>) => setMatrixData(d)} />
                  </div>
                </CollapsibleSection>
              )}

              {/* Research Summary */}
              <CollapsibleSection
                icon={<Search size={16} color="#2563EB" />}
                title="Research Summary" badge="Submitted"
                collapsed={isBriefCollapsed} onToggle={() => setIsBriefCollapsed((p) => !p)}
              >
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                  <PreviewBody formData={submittedBrief} />
                </div>
              </CollapsibleSection>

              {/* Market Analyst Report */}
              {step >= 2 && analysisResult && (
                <CollapsibleSection
                  icon={<BarChart2 size={16} color="var(--color-primary)" />}
                  title="Market Analyst Report" badge={isApproved ? 'Approved' : 'Generated'}
                  collapsed={isReportCollapsed} onToggle={() => setIsReportCollapsed((p) => !p)}
                >
                  <div style={{ padding: '0 1rem 1rem' }}>
                    <AnalysisReportView isApproved={true} analysisResult={analysisResult} />
                  </div>
                </CollapsibleSection>
              )}

              {/* Copywriting Strategy */}
              {strategicData && (
                <CollapsibleSection
                  icon={<MessageSquareText size={16} color="var(--color-primary)" />}
                  title="Copywriting Strategy" badge="Confirmed"
                  collapsed={isStrategicCollapsed} onToggle={() => setIsStrategicCollapsed((p) => !p)}
                >
                  <div style={{ padding: '0 1rem 1rem' }}>
                    <StrategicMessage strategicData={strategicData} isApproved={true} readOnly />
                  </div>
                </CollapsibleSection>
              )}

              {/* Generated Copy */}
              {copyResults && (
                <CollapsibleSection
                  icon={<Globe size={16} color="var(--color-primary)" />}
                  title="Generated Copy" badge="Generated"
                  collapsed={isCopyResultsCollapsed} onToggle={() => setIsCopyResultsCollapsed((p) => !p)}
                >
                  <div style={{ padding: '0 1rem 1rem' }}>
                    <CopyResults results={copyResults} readOnly />
                  </div>
                </CollapsibleSection>
              )}
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* ── Message Matrix 입력 (기본 펼침) ── */}
              <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <div
                  onClick={() => setMatrixSectionOpen(p => !p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '14px 20px', cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  {matrixSectionOpen
                    ? <ChevronDown size={16} color="var(--color-text-secondary)" />
                    : <ChevronRight size={16} color="var(--color-text-secondary)" />}
                  <FileText size={16} color="var(--color-primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('matrix.title')}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLoadSampleMatrix(); }}
                    disabled={sampleLoading || step > 1 || isAnalyzing}
                    style={{
                      marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 10px', borderRadius: 6, border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)', cursor: sampleLoading ? 'wait' : 'pointer',
                      fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)',
                      opacity: (sampleLoading || step > 1 || isAnalyzing) ? 0.5 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {sampleLoading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <FlaskConical size={13} />}
                    Test Sample File
                  </button>
                  {matrixData && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600,
                      padding: '2px 8px', borderRadius: 4,
                      background: 'var(--color-success-bg)', color: 'var(--color-success-text)',
                      border: '1px solid var(--color-success-border)',
                    }}>Loaded</span>
                  )}
                </div>
                {matrixSectionOpen && (
                  <div style={{ padding: '0 20px 16px' }}>
                    <MessageMatrixUpload
                      onParsed={(data: Record<string, unknown>) => setMatrixData(data)}
                      isDisabled={step > 1 || isAnalyzing}
                      onActionNotify={handleActionNotify}
                    />
                    {matrixData && (
                      <div style={{ marginTop: 12 }}>
                        <MessageMatrixEditor
                          matrixData={matrixData}
                          onChange={(updated: Record<string, unknown>) => setMatrixData(updated)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── LG Campaign Research (기본 접힘) ── */}
              <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <div
                  onClick={() => setBriefSectionOpen(p => !p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '14px 20px', cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  {briefSectionOpen
                    ? <ChevronDown size={16} color="var(--color-text-secondary)" />
                    : <ChevronRight size={16} color="var(--color-text-secondary)" />}
                  <Search size={16} color="#2563EB" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>LG Campaign Research</span>
                </div>
                {briefSectionOpen && (
                  <BriefingForm
                    onStartAnalysis={handleStartAnalysis}
                    isAnalyzing={isAnalyzing}
                    isDisabled={step > 1}
                    onGuideSelect={handleGuideSelect}
                    onActionNotify={handleActionNotify}
                    matrixData={matrixData}
                    onFormChange={(data: Record<string, string>) => setBriefFormData(data)}
                    initialData={briefFormData || submittedBrief}
                  />
                )}
              </div>

              {/* ── Preview + Submit 버튼 ── */}
              {(matrixData || briefFormData?.projectName) && (
                <div style={{
                  padding: '16px 20px', background: 'var(--color-surface)',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex', gap: 10, justifyContent: 'flex-end',
                  position: 'sticky', bottom: 0, zIndex: 5,
                  boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
                }}>
                  <button
                    onClick={() => setShowMatrixPreview(true)}
                    style={{
                      padding: '10px 20px', borderRadius: 8,
                      border: '1px solid var(--color-border)', background: '#FFF',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      color: 'var(--color-text-primary)',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <FileText size={15} /> Preview
                  </button>
                  <button
                    onClick={() => {
                      // briefFormData(LG Campaign Research 폼)를 우선 사용, 없으면 Matrix에서 자동 매핑
                      if (briefFormData?.projectName) {
                        handleStartAnalysis(briefFormData as unknown as CampaignBrief)
                      } else if (matrixData) {
                        const firstSheet = Object.keys(matrixData)[0]
                        const product = matrixData[firstSheet] as Record<string, unknown>
                        const autoBrief = {
                          projectName: `${product.product_name || ''}${product.sub_name ? ' ' + product.sub_name : ''}`,
                          date: new Date().toISOString().slice(0, 10),
                          projectContext: (product.description as string) || '',
                          objectiveCommercial: '',
                          objectiveBehavior: '',
                          objectiveAttitudinal: '',
                          audience: '',
                          keyMessage: (product.head_message as string) || '',
                          proofPoints: ((product.categories as Array<Record<string, unknown>>) || [])
                            .flatMap((c: Record<string, unknown>) =>
                              ((c.usps as Array<Record<string, string>>) || []).map(u => `[${u.feature_name}] ${u.benefit_description}`)
                            )
                            .filter(Boolean)
                            .join('\n'),
                          mandatories: ((product.categories as Array<Record<string, unknown>>) || [])
                            .flatMap((c: Record<string, unknown>) =>
                              ((c.usps as Array<Record<string, string>>) || []).map(u => u.disclaimer).filter(Boolean)
                            )
                            .join('\n'),
                          budget: '',
                          marketNeeds: '',
                          timing: '',
                        }
                        handleStartAnalysis(autoBrief as CampaignBrief)
                      }
                    }}
                    disabled={isAnalyzing}
                    style={{
                      padding: '10px 24px', borderRadius: 8, border: 'none',
                      background: isAnalyzing ? '#999' : 'var(--color-primary)',
                      color: '#FFF', fontSize: 13, fontWeight: 600, cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      boxShadow: isAnalyzing ? 'none' : '0 4px 12px var(--color-primary-shadow)',
                    }}
                  >
                    {isAnalyzing ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={15} />}
                    {isAnalyzing ? 'Analyzing...' : 'Submit & Analyze'}
                  </button>
                </div>
              )}

              {/* Preview Modal */}
              {showMatrixPreview && (
                <MessageMatrixPreviewModal
                  matrixData={matrixData}
                  briefData={briefFormData}
                  onClose={() => setShowMatrixPreview(false)}
                />
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 6, cursor: 'col-resize', flexShrink: 0, position: 'relative', zIndex: 10,
            background: isDragging ? 'var(--color-primary)' : 'transparent',
            transition: isDragging ? 'none' : 'background 0.2s',
          }}
          onMouseDown={handleMouseDown}
          onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.background = 'var(--color-border)' }}
          onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.background = 'transparent' }}
        />

        {/* Right panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-bg)', minWidth: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <InitialView />

            {timeline.map((item, i) => {
              switch (item.type) {
                case 'chat-user':
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{
                        background: 'var(--color-primary)', color: '#fff',
                        padding: '10px 16px', borderRadius: '18px', borderBottomRightRadius: 4,
                        maxWidth: '70%', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                      }}>{item.content}</div>
                    </div>
                  )
                case 'chat-assistant':
                  return (
                    <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', maxWidth: '85%' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--radius-lg)',
                        background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', flexShrink: 0, boxShadow: '0 4px 10px var(--color-primary-shadow)',
                      }}>
                        <Bot size={18} />
                      </div>
                      <div style={{
                        background: 'var(--color-surface)', padding: '10px 16px',
                        borderRadius: '18px', borderTopLeftRadius: 4,
                        boxShadow: 'var(--shadow-sm)', fontSize: '0.9rem', lineHeight: 1.6,
                      }}>
                        <Markdown>{item.content || ''}</Markdown>
                      </div>
                    </div>
                  )
                case 'analysis-result':
                  return <ResultView key={i} onApprove={handleApprove} onModify={handleModify} isApproved={isApproved} analysisResult={analysisResult} />
                case 'strategic-message':
                  return <StrategicMessageView key={i} strategicData={strategicData} isStrategicLoading={isStrategicLoading} isStrategicApproved={isStrategicApproved} onModifyStrategic={handleModifyStrategic} onApproveStrategic={handleApproveStrategic} onUpdateStrategic={setStrategicData} />
                case 'generation-config':
                  return <GenerationConfigView key={i} onSubmitGeneration={handleSubmitGeneration} isGenerating={isGenerating} aiPersonas={aiPersonas} />
                case 'copy-results':
                  return <CopyResultsView key={i} copyResults={copyResults} isGenerating={isGenerating} onUpdateCopyResults={setCopyResults} onReview={copyResults && step < 5 ? handleReview : undefined} copyCandidates={copyCandidates} selectedCandidateIdx={selectedCandidateIdx} onSelectCandidate={(idx: number) => {
                    // 현재 후보의 편집 내용을 보존
                    if (copyCandidates?.candidates && copyResults) {
                      const updated = { ...copyCandidates, candidates: [...copyCandidates.candidates] }
                      updated.candidates[selectedCandidateIdx] = { ...updated.candidates[selectedCandidateIdx], copies: copyResults as unknown as CopyResult[] }
                      setCopyCandidates(updated)
                    }
                    setSelectedCandidateIdx(idx)
                    const c = copyCandidates?.candidates
                    if (c?.[idx]) setCopyResults(c[idx].copies as CopyResult[])
                  }} />
                case 'action-status':
                  return <ActionStatusBubble key={i} item={item} />
                case 'review':
                  return <ReviewView key={i} copyResults={copyResults} selectedCopies={selectedCopies} onToggleCopy={(k: string) => setSelectedCopies((prev) => { const next = new Set(prev); if (next.has(k)) next.delete(k); else next.add(k); return next })} enabledSkills={reviewSkills} onToggleSkill={(id: string) => setReviewSkills((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])} onSubmitReview={handleSubmitReview} isReviewing={isReviewing} availableSkills={availableSkills} />
                case 'review-results':
                  return <ReviewResultsView key={i} reviewResults={reviewResults} reviewSummary={reviewSummary} copyResults={copyResults} isReviewing={isReviewing} onSaveExit={handleSaveExit} onExitWithoutSave={() => navigate('/')} isSaving={isSaving} onCorrectCopy={handleCorrectCopy} onUpdateAndReReview={handleUpdateAndReReview} />
                default:
                  return null
              }
            })}

            {isChatLoading && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', flexShrink: 0,
                }}>
                  <Bot size={18} />
                </div>
                <div style={{
                  background: 'var(--color-surface)', padding: '10px 16px',
                  borderRadius: '18px', borderTopLeftRadius: 4, boxShadow: 'var(--shadow-sm)',
                  display: 'flex', gap: 5, alignItems: 'center',
                }}>
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-text-muted)' }} />
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Generating response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <div style={{
            padding: '1rem 1.5rem', background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10, alignItems: 'flex-end',
          }}>
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend() } }}
              placeholder={chatPlaceholders[step] || chatPlaceholders[1]}
              rows={2}
              disabled={isChatLoading}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)', fontSize: '0.9rem', outline: 'none',
                resize: 'none', lineHeight: 1.5, maxHeight: 120,
                background: 'var(--color-bg)', color: 'var(--color-text)',
              }}
            />
            <button
              onClick={handleChatSend}
              disabled={!canSend}
              style={{
                width: 42, height: 42, borderRadius: 'var(--radius-lg)', border: 'none',
                background: canSend ? 'var(--color-primary)' : 'var(--color-border)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: canSend ? 'pointer' : 'not-allowed', flexShrink: 0, transition: 'background 0.2s',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
