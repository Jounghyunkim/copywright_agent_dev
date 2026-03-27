import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Send, Bot, Loader, ChevronDown, ChevronRight, FileText, BarChart2,
  MessageSquareText, Globe, Sparkles, CheckCircle, XCircle, Zap,
  ClipboardCheck, Search, Check,
} from 'lucide-react'
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { ProcessingModal } from '@/shared/ui/processing-modal'
import { Markdown } from '@/shared/ui/markdown'
import { useUIStore } from '@/shared/state/ui-store'
import { readSSE, apiClient } from '@/shared/api/client'
import type {
  CampaignBrief, AnalysisReport, StrategicMessageData,
  CopyResult, ReviewResult, ReviewSummary,
} from '@/shared/api/types'

// Lazy-import existing JSX components that still live in components/
// These are kept as-is from the old codebase, just re-exported
import BriefingForm, { PreviewBody } from '@/components/BriefingForm'
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
const STEP_LABELS = ['Briefing', 'Analysis', 'Strategic Message', 'Generation', 'Review']
const STEP_ICONS = [FileText, Search, MessageSquareText, Zap, ClipboardCheck]


/* ──────────────────── Action config (timeline) ──────────────────── */
const ACTION_CONFIG: Record<string, { icon: typeof Zap; label: string; color: string }> = {
  'brief-auto-generate': { icon: Sparkles, label: 'AI Brief Auto-generation', color: '#7C3AED' },
  'submit-brief': { icon: FileText, label: 'Submit Brief & Start Analysis', color: 'var(--color-primary)' },
  'approve-analysis': { icon: CheckCircle, label: 'Approve Analysis', color: '#059669' },
  'strategic-message-extract': { icon: MessageSquareText, label: 'Strategic Message Extraction', color: '#2563EB' },
  'approve-strategic': { icon: CheckCircle, label: 'Approve Strategic Message', color: '#059669' },
  'generate-copy': { icon: Zap, label: 'Generate Copy', color: '#D97706' },
  'start-review': { icon: ClipboardCheck, label: 'Start Review', color: '#7C3AED' },
  'submit-review': { icon: ClipboardCheck, label: 'Skillset Review', color: 'var(--color-primary)' },
  'save-campaign': { icon: CheckCircle, label: 'Save Campaign', color: '#059669' },
  'modify-brief': { icon: FileText, label: 'Modify Brief', color: 'var(--color-error)' },
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
const STEP_DESCS = ['Campaign brief', 'Market research', 'Message strategy', 'Copy creation', 'Final approval']

function StepProgressBar({ step, reviewCompleted }: { step: Step; reviewCompleted: boolean }) {
  const getStepColor = (done: boolean, active: boolean) => {
    if (done) return '#22C55E'
    if (active) return '#A50034'
    return '#D1D5DB'
  }

  return (
    <nav style={{
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      borderBottom: '1px solid var(--color-border)',
      height: 64,
      gap: 0,
    }}>
      {STEP_LABELS.map((label, i) => {
        const s = (i + 1) as Step
        const done = step > s || (s === 5 && reviewCompleted)
        const active = step === s && !reviewCompleted
        const Icon = STEP_ICONS[i]
        const color = getStepColor(done, active)

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 16px', borderRadius: 12,
              backgroundColor: active ? '#FFF0F3' : done ? '#F0FFF4' : 'transparent',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'default',
            }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  backgroundColor: done ? '#22C55E' : active ? '#A50034' : '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: done || active ? '#fff' : '#9CA3AF',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  flexShrink: 0,
                  boxShadow: active
                    ? '0 4px 12px rgba(165, 0, 52, 0.25)'
                    : done
                    ? '0 4px 12px rgba(52, 199, 89, 0.25)'
                    : 'none',
                }}>
                  {done ? <Check size={16} strokeWidth={3} /> : <Icon size={15} />}
                </div>
                <div style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 14, height: 14, borderRadius: '50%',
                  backgroundColor: '#fff', color,
                  fontSize: '0.55rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${color}`,
                }}>{s}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const }}>
                <span style={{
                  fontSize: '0.82rem', fontWeight: active ? 700 : 600,
                  color: active ? '#A50034' : done ? '#22C55E' : 'var(--color-text)',
                  lineHeight: 1.2, transition: 'color 0.3s ease',
                }}>{label}</span>
                <span style={{
                  fontSize: '0.68rem',
                  color: active ? 'rgba(165, 0, 52, 0.6)' : done ? 'rgba(52, 199, 89, 0.7)' : 'var(--color-text-secondary)',
                  lineHeight: 1.2, marginTop: 1, transition: 'color 0.3s ease',
                }}>{STEP_DESCS[i]}</span>
              </div>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, flexShrink: 0 }}>
                <div style={{
                  width: 20, height: 2, borderRadius: 1,
                  backgroundColor: done ? '#22C55E' : 'var(--color-border)',
                  transition: 'background-color 0.35s ease',
                }} />
                <ChevronRight size={14} style={{
                  color: done ? '#22C55E' : '#D1D5DB',
                  transition: 'color 0.35s ease',
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopyResultsCollapsed, setIsCopyResultsCollapsed] = useState(false)
  const [reviewSkills, setReviewSkills] = useState(['brand-lexicon-check', 'cultural-sensitivity-check'])
  const [selectedCopies, setSelectedCopies] = useState<Set<string>>(new Set())
  const [analysisProgress, setAnalysisProgress] = useState<string[]>([])
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewResults, setReviewResults] = useState<ReviewResult[] | null>(null)
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)
  const [availableSkills, setAvailableSkills] = useState<unknown[] | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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

  // Load skills
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
    fetchSkills()
  }, [])

  // Load existing campaign
  useEffect(() => {
    if (!campaignData) return
    const d = campaignData as Record<string, unknown>
    setSubmittedBrief(d.brief as CampaignBrief)
    setAnalysisResult(d.analysisReport as AnalysisReport)
    setStrategicData(d.strategicMessage as StrategicMessageData)
    setCopyResults(d.copyResults as CopyResult[])
    setIsApproved(true)
    setIsStrategicApproved(true)
    setIsBriefCollapsed(true)
    setIsReportCollapsed(true)
    setIsStrategicCollapsed(true)
    setIsCopyResultsCollapsed(false)
    if (d.reviewResults && (d.reviewResults as unknown[]).length > 0) {
      setReviewResults(d.reviewResults as ReviewResult[])
    }
    if (d.reviewSummary) setReviewSummary(d.reviewSummary as ReviewSummary)
    const allKeys = new Set<string>();
    ((d.copyResults as CopyResult[]) || []).forEach((r) => {
      const copies = r.copies || [r]
      copies.forEach((_, idx) => allKeys.add(`${r.countryCode}-${idx}`))
    })
    setSelectedCopies(allKeys)
    setTimeline([
      { type: 'analysis-result' },
      { type: 'strategic-message' },
      { type: 'generation-config' },
      { type: 'copy-results' },
      { type: 'action-status', action: 'save-campaign', status: 'completed', detail: `Campaign "${(d as Record<string, unknown>).projectName}" loaded` },
      { type: 'review' },
      ...((d.reviewResults as unknown[])?.length ? [{ type: 'review-results' }] : []),
    ])
    setStep(5)
  }, [campaignData])

  /* ── Handlers ── */
  const handleStartAnalysis = async (formData: CampaignBrief) => {
    setSubmittedBrief(formData)
    setIsAnalyzing(true)
    setAnalysisResult(null)
    setIsApproved(false)
    setAnalysisProgress([])
    addAction('submit-brief', 'started', `Project: ${formData.projectName}`)

    try {
      await readSSE('/api/v1/campaigns/analyze', formData, (event) => {
        if (event.type === 'result') {
          setAnalysisResult(event.data as AnalysisReport)
          addAction('submit-brief', 'completed', 'Market Analyst Report generated')
          addToTimeline({ type: 'analysis-result' })
          setStep(2)
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
    addAction('approve-analysis', 'completed', 'Market Analyst Report approved')
    addAction('strategic-message-extract', 'started', 'Extracting strategic message...')
    addToTimeline({ type: 'strategic-message' })
    setIsStrategicLoading(true)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || ''
      const res = await fetch(`${apiBase}/api/v1/campaigns/strategic-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: submittedBrief, analysisReport: analysisResult }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      setStrategicData(result.data)
      addAction('strategic-message-extract', 'completed', 'Core Message + Message Pillars extracted')
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      addAction('strategic-message-extract', 'failed', msg)
      addToast('Strategic message extraction failed.', 'error')
    } finally {
      setIsStrategicLoading(false)
    }
  }

  const handleModify = () => {
    addAction('modify-brief', 'completed', 'Returning to Step 1 for brief modification')
    setAnalysisResult(null)
    setSubmittedBrief(null)
    setStrategicData(null)
    setIsBriefCollapsed(true)
    setIsStrategicApproved(false)
    setIsApproved(false)
    setAnalysisProgress([])
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
    setIsReportCollapsed(true)
    addAction('approve-strategic', 'completed', 'Strategic Message approved')
    addToTimeline({ type: 'generation-config' })
    setStep(4)
  }

  const handleSubmitGeneration = async (config: { countries: string[]; copyCount: number; ageGroup?: string; persona?: string }) => {
    setIsGenerating(true)
    setCopyResults(null)
    addAction('generate-copy', 'started', `${config.countries.length} countries x ${config.copyCount} variants`)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || ''
      const res = await fetch(`${apiBase}/api/v1/campaigns/generate-copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: submittedBrief, analysisReport: analysisResult,
          strategicMessage: strategicData, config,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      setCopyResults(result.data)
      const totalCopies = (result.data || []).reduce((s: number, r: CopyResult) => s + (r.copies?.length || 1), 0)
      addAction('generate-copy', 'completed', `${totalCopies} copies generated`)
      addToTimeline({ type: 'copy-results' })
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
    setIsStrategicCollapsed(true)
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
          setReviewSummary((event as Record<string, unknown>).summary as ReviewSummary)
          const summary = (event as Record<string, unknown>).summary as ReviewSummary
          addAction('submit-review', 'completed', `Avg Score: ${summary?.avgScore} (${summary?.passed}/${summary?.total} Pass)`)
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

  const handleSaveExit = async () => {
    setIsSaving(true)
    const isUpdate = !!campaignId
    addAction('save-campaign', 'started', isUpdate ? 'Updating...' : 'Saving...')
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || ''
      const url = isUpdate ? `${apiBase}/api/v1/campaigns/${campaignId}` : `${apiBase}/api/v1/campaigns/save`
      const res = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: submittedBrief, analysisReport: analysisResult,
          strategicMessage: strategicData, copyResults, reviewSummary, reviewResults,
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
    1: 'Ask about brief writing: target audience, key message, tone & manner... (Enter to send)',
    2: 'Ask about analysis: persona, brand fit, competitive keywords... (Enter to send)',
    3: 'Ask about strategic message: core message, pillars direction... (Enter to send)',
    4: 'Ask about generated copies: headlines, CTA effectiveness... (Enter to send)',
    5: 'Ask about review results: scores, improvement suggestions... (Enter to send)',
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
      <StepProgressBar step={step} reviewCompleted={!!reviewSummary} />

      {isDragging && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, cursor: 'col-resize' }} />
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }} ref={mainAreaRef}>
        {/* Left panel */}
        <div style={{
          width: `${leftRatio * 100}%`, flexShrink: 0, overflow: 'hidden',
          borderRight: '1px solid var(--color-border)',
        }}>
          {step >= 3 && submittedBrief ? (
            <div style={{ width: '100%', height: '100%', background: 'var(--color-bg)', overflowY: 'auto' }}>
              <CollapsibleSection
                icon={<FileText size={16} color="var(--color-primary)" />}
                title="Campaign Brief" badge="Submitted"
                collapsed={isBriefCollapsed} onToggle={() => setIsBriefCollapsed((p) => !p)}
              >
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                  <PreviewBody formData={submittedBrief} />
                </div>
              </CollapsibleSection>

              {step >= 4 ? (
                <CollapsibleSection
                  icon={<BarChart2 size={16} color="var(--color-primary)" />}
                  title="Market Analyst Report" badge="Approved"
                  collapsed={isReportCollapsed} onToggle={() => setIsReportCollapsed((p) => !p)}
                >
                  <div style={{ padding: '0 1rem 1rem' }}>
                    <AnalysisReportView isApproved={true} analysisResult={analysisResult} />
                  </div>
                </CollapsibleSection>
              ) : (
                <div style={{ padding: '1rem' }}>
                  <AnalysisReportView isApproved={true} analysisResult={analysisResult} />
                </div>
              )}

              {step >= 4 && strategicData && (
                <CollapsibleSection
                  icon={<MessageSquareText size={16} color="var(--color-primary)" />}
                  title="Strategic Message" badge="Confirmed"
                  collapsed={isStrategicCollapsed} onToggle={() => setIsStrategicCollapsed((p) => !p)}
                >
                  <div style={{ padding: '0 1rem 1rem' }}>
                    <StrategicMessage strategicData={strategicData} isApproved={true} readOnly />
                  </div>
                </CollapsibleSection>
              )}

              {step >= 5 && copyResults && (
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
          ) : step > 1 && submittedBrief ? (
            <div style={{ width: '100%', height: '100%', background: 'var(--color-surface)', overflowY: 'auto', padding: '1.5rem' }}>
              <PreviewBody formData={submittedBrief} />
            </div>
          ) : (
            <BriefingForm
              onStartAnalysis={handleStartAnalysis}
              isAnalyzing={isAnalyzing}
              isDisabled={step > 1}
              onGuideSelect={handleGuideSelect}
              onActionNotify={handleActionNotify}
            />
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
                  return <GenerationConfigView key={i} onSubmitGeneration={handleSubmitGeneration} isGenerating={isGenerating} />
                case 'copy-results':
                  return <CopyResultsView key={i} copyResults={copyResults} isGenerating={isGenerating} onUpdateCopyResults={setCopyResults} onReview={copyResults && step < 5 ? handleReview : undefined} />
                case 'action-status':
                  return <ActionStatusBubble key={i} item={item} />
                case 'review':
                  return <ReviewView key={i} copyResults={copyResults} selectedCopies={selectedCopies} onToggleCopy={(k: string) => setSelectedCopies((prev) => { const next = new Set(prev); if (next.has(k)) next.delete(k); else next.add(k); return next })} enabledSkills={reviewSkills} onToggleSkill={(id: string) => setReviewSkills((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])} onSubmitReview={handleSubmitReview} isReviewing={isReviewing} availableSkills={availableSkills} />
                case 'review-results':
                  return <ReviewResultsView key={i} reviewResults={reviewResults} reviewSummary={reviewSummary} copyResults={copyResults} isReviewing={isReviewing} onSaveExit={handleSaveExit} onExitWithoutSave={() => navigate('/')} isSaving={isSaving} />
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
