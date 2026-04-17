import { CSSProperties, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { StepIndicator } from '@/shared/ui/step-indicator'
import { SplitPane } from '@/shared/ui/split-pane'

import { BriefingForm, BriefPreviewPanel } from '@/features/brief'
import { ChatPanel, type ChatPanelHandle } from '@/features/chat'
import { AnalysisReport } from '@/features/analysis'
import { StrategicMessageView } from '@/features/strategic-message'
import { CopyResults, GenerationConfig } from '@/features/copy-generation'
import { ReviewConfig, ReviewResults } from '@/features/review'
import {
  useAnalyzeSSE,
  useCampaign,
  useGenerateCopy,
  useRunReviewSSE,
  useSaveCampaign,
  useSkills,
  useStrategicMessage,
  useUpdateCampaign,
} from '@/shared/api/hooks'
import { useWorkflowStore } from '@/shared/state/workflow-store'
import type {
  CampaignBrief,
  CampaignSaveRequest,
  CopyItem,
  GenerationConfig as GenerationConfigT,
  MessageMatrixProduct,
  ReviewResult,
  ReviewSummary,
  SelectedCopy,
} from '@/shared/api/types'

const STEPS = [
  { step: 1, label: '브리핑' },
  { step: 2, label: '분석' },
  { step: 3, label: '전략 메시지' },
  { step: 4, label: '카피 생성' },
  { step: 5, label: '검토' },
]

export function EditorPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [reviewCompleted, setReviewCompleted] = useState(false)
  const [previewBrief, setPreviewBrief] = useState<CampaignBrief | null>(null)
  const leftPaneRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<ChatPanelHandle>(null)

  /** 특정 단계의 최상단으로 부드럽게 스크롤 */
  const scrollToStepTop = useCallback((step: number) => {
    setTimeout(() => {
      const el = leftPaneRef.current?.querySelector(`[data-step="${step}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 150)
  }, [])

  /** 가이드 (?) 클릭 → 채팅에 어시스턴트 메시지로 표시 */
  const handleGuideRequest = useCallback((title: string, guide: string) => {
    chatRef.current?.addAssistantMessage(`📋 **${title}** 작성 가이드\n\n${guide}`)
  }, [])


  const campaignId = useWorkflowStore((s) => s.campaignId)
  const campaignStatus = useWorkflowStore((s) => s.campaignStatus)
  const currentStep = useWorkflowStore((s) => s.currentStep)
  const brief = useWorkflowStore((s) => s.brief)
  const messageMatrix = useWorkflowStore((s) => s.messageMatrix)
  const analysisReport = useWorkflowStore((s) => s.analysisReport)
  const analysisApproved = useWorkflowStore((s) => s.analysisApproved)
  const strategicMessage = useWorkflowStore((s) => s.strategicMessage)
  const strategicMessageApproved = useWorkflowStore(
    (s) => s.strategicMessageApproved,
  )
  const copyResults = useWorkflowStore((s) => s.copyResults)
  const selectedCopies = useWorkflowStore((s) => s.selectedCopies)
  const reviewResults = useWorkflowStore((s) => s.reviewResults)

  const setCampaignId = useWorkflowStore((s) => s.setCampaignId)
  const setCampaignStatus = useWorkflowStore((s) => s.setCampaignStatus)
  const setBrief = useWorkflowStore((s) => s.setBrief)
  const setMessageMatrix = useWorkflowStore((s) => s.setMessageMatrix)
  const setCurrentStep = useWorkflowStore((s) => s.setCurrentStep)
  const setAnalysisReport = useWorkflowStore((s) => s.setAnalysisReport)
  const setAnalysisApproved = useWorkflowStore((s) => s.setAnalysisApproved)
  const setStrategicMessage = useWorkflowStore((s) => s.setStrategicMessage)
  const setStrategicMessageApproved = useWorkflowStore(
    (s) => s.setStrategicMessageApproved,
  )
  const setCopyResults = useWorkflowStore((s) => s.setCopyResults)
  const setSelectedCopies = useWorkflowStore((s) => s.setSelectedCopies)
  const setReviewResults = useWorkflowStore((s) => s.setReviewResults)
  const hydrateFromCampaign = useWorkflowStore((s) => s.hydrateFromCampaign)
  const reset = useWorkflowStore((s) => s.reset)

  const analyze = useAnalyzeSSE()
  const strategic = useStrategicMessage()
  const generateCopy = useGenerateCopy()
  const runReview = useRunReviewSSE()
  const skillsQuery = useSkills()
  const saveCampaign = useSaveCampaign()
  const updateCampaign = useUpdateCampaign()

  /* ── URL ?campaignId=xxx 동기화 ── */
  const urlCampaignId = searchParams.get('campaignId')
  const shouldLoadFromUrl = !!urlCampaignId && urlCampaignId !== campaignId
  const loadedCampaign = useCampaign(shouldLoadFromUrl ? urlCampaignId : null)

  useEffect(() => {
    if (shouldLoadFromUrl && loadedCampaign.data) {
      hydrateFromCampaign(loadedCampaign.data)
    }
  }, [shouldLoadFromUrl, loadedCampaign.data, hydrateFromCampaign])

  /* ── Handlers ── */

  const handleBriefSubmit = async (submitted: CampaignBrief) => {
    setBrief(submitted)
    setAnalysisReport(null)
    setAnalysisApproved(false)
    setStrategicMessage(null)
    setStrategicMessageApproved(false)
    setCopyResults(null)
    setSelectedCopies([])
    setCurrentStep(2)
    const report = await analyze.run({
      ...submitted,
      message_matrix: messageMatrix ?? null,
    })
    if (report) {
      setAnalysisReport(report)
      scrollToStepTop(2)
    } else if (!analyze.isError) {
      // cancelled or empty
    } else {
      setCurrentStep(1)
    }
  }

  const handleApproveAnalysis = () => {
    setAnalysisApproved(true)
    setCurrentStep(3)
    scrollToStepTop(3)
    // 승인 즉시 전략 메시지 자동 추출
    handleExtractStrategy()
  }

  /** 이전 단계로 돌아가기 — 해당 단계 이후의 모든 결과를 초기화 */
  const handleGoBack = (targetStep: number) => {
    const stepLabels: Record<number, string> = {
      1: '브리핑',
      2: '분석',
      3: '전략 메시지',
      4: '카피 생성',
    }
    if (
      !confirm(
        `${stepLabels[targetStep] ?? targetStep + '단계'}(으)로 돌아가면 현재 결과와 이후 단계가 초기화됩니다. 계속하시겠습니까?`,
      )
    )
      return

    // 완료된 캠페인을 재편집 모드로 되돌림 (스테퍼가 모두 done으로 고정되지 않도록)
    if (campaignStatus === 'completed') {
      setCampaignStatus('draft')
    }

    if (targetStep <= 1) {
      setAnalysisReport(null)
    }
    if (targetStep <= 2) {
      setAnalysisApproved(false)
      setStrategicMessage(null)
    }
    if (targetStep <= 3) {
      setStrategicMessageApproved(false)
      setCopyResults(null)
      setCopyDiagnostics(null)
    }
    if (targetStep <= 4) {
      setSelectedCopies([])
      setReviewResults(null)
    }
    setCurrentStep(targetStep)
    scrollToStepTop(targetStep)
  }

  const handleExtractStrategy = async () => {
    if (!analysisReport) return
    try {
      const res = await strategic.mutateAsync({
        brief,
        analysisReport,
        locale: 'ko',
      })
      if (res.status === 'success' && res.data) {
        setStrategicMessage(res.data)
        setStrategicMessageApproved(false)
        scrollToStepTop(3)
      } else {
        throw new Error('Empty strategic message result')
      }
    } catch (err) {
      console.error('[EditorPage] strategic-message failed', err)
    }
  }

  const handleApproveStrategy = () => {
    setStrategicMessageApproved(true)
    setCurrentStep(4)
    scrollToStepTop(4)
  }

  const handleModifyStrategy = () => handleGoBack(2)

  const [copyDiagnostics, setCopyDiagnostics] = useState<
    import('@/shared/api/types').CopyDiagnostic[][] | null
  >(null)

  const handleGenerateCopy = async (cfg: GenerationConfigT) => {
    if (!analysisReport || !strategicMessage) return
    setCopyResults(null)
    setSelectedCopies([])
    setCopyDiagnostics(null)
    try {
      const res = await generateCopy.mutateAsync({
        brief,
        analysisReport,
        strategicMessage,
        config: cfg,
      })
      if (res.status === 'success' && res.data) {
        setCopyResults(res.data)
        if ((res as any).diagnostics) {
          setCopyDiagnostics((res as any).diagnostics)
        }
        scrollToStepTop(4)
      } else {
        throw new Error('Empty copy result')
      }
    } catch (err) {
      console.error('[EditorPage] generate-copy failed', err)
    }
  }

  const handleProceedToReview = (selected: SelectedCopy[]) => {
    if (selected.length === 0) return
    setSelectedCopies(selected)
    setReviewResults(null)
    setCurrentStep(5)
    scrollToStepTop(5)
  }

  /** 보정된 카피 1건에 대해 동일 스킬셋으로 재평가 */
  const handleReReview = async (
    copyKey: string,
    correctedCopyData: CopyItem,
    skillIds: string[],
  ): Promise<ReviewResult[]> => {
    if (!analysisReport || !strategicMessage) return []
    const copy = selectedCopies.find((c) => c.key === copyKey)
    if (!copy) return []

    const singleCopy: SelectedCopy = {
      key: copy.key,
      countryCode: copy.countryCode,
      copyData: correctedCopyData,
    }
    const results = await runReview.run({
      brief,
      analysisReport,
      strategicMessage,
      selectedCopies: [singleCopy],
      enabledSkills: skillIds,
    })
    return results
  }

  const reviewSummary: ReviewSummary | null = useMemo(() => {
    if (!reviewResults?.length) return null
    const total = reviewResults.length
    const passed = reviewResults.filter((r) => r.passed).length
    const failed = total - passed
    const avgScore =
      Math.round(
        (reviewResults.reduce((s, r) => s + r.score, 0) / total) * 10,
      ) / 10
    return { avgScore, passed, failed, total }
  }, [reviewResults])

  const buildSaveRequest = (): CampaignSaveRequest => ({
    brief,
    analysisReport,
    strategicMessage,
    copyResults,
    reviewSummary,
    reviewResults,
    copyCandidates: null,
    currentStep,
  })

  const handleSave = async () => {
    if (!brief.projectName.trim()) {
      alert('저장하려면 프로젝트명이 필요합니다.')
      return
    }
    try {
      if (campaignId) {
        await updateCampaign.mutateAsync({
          id: campaignId,
          body: buildSaveRequest(),
        })
      } else {
        const res = await saveCampaign.mutateAsync(buildSaveRequest())
        setCampaignId(res.id)
        setSearchParams({ campaignId: res.id }, { replace: true })
      }
    } catch (err) {
      console.error('[EditorPage] save failed', err)
      alert('저장에 실패했습니다. 백엔드 연결을 확인해 주세요.')
    }
  }

  const handleRunReview = async (enabledSkillIds: string[]) => {
    if (
      !analysisReport ||
      !strategicMessage ||
      selectedCopies.length === 0 ||
      enabledSkillIds.length === 0
    )
      return
    const results = await runReview.run({
      brief,
      analysisReport,
      strategicMessage,
      selectedCopies,
      enabledSkills: enabledSkillIds,
    })
    if (results.length > 0) {
      setReviewResults(results)
      scrollToStepTop(5)
    }
  }

  /* ── Left pane: 폼 + 모든 진행 결과 (세로 스크롤) ── */

  const renderLeftPane = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Step 1: 브리핑 */}
      <div data-step="1" />
      <CollapsibleStep step={1} label="브리핑" currentStep={currentStep}>
        {previewBrief ? (
          <BriefPreviewPanel
            brief={previewBrief}
            matrixData={messageMatrix as Record<string, MessageMatrixProduct> | null}
            onBack={() => setPreviewBrief(null)}
          />
        ) : (
          <BriefingForm
            initialBrief={brief}
            onChange={(b) => setBrief(b)}
            onSubmit={handleBriefSubmit}
            onMatrixParsed={(m) => setMessageMatrix(m)}
            onGuideRequest={handleGuideRequest}
            onPreview={(b) => setPreviewBrief(b)}
            isAnalyzing={analyze.isPending}
            isDisabled={currentStep > 1 && !!analysisReport}
          />
        )}
      </CollapsibleStep>

      {/* Step 2: 분석 */}
      <div data-step="2" />
      {/* 분석 로딩 */}
      {analyze.isPending && !analysisReport && (
        <AnalyzingCard
          messages={analyze.progressMessages}
          onCancel={analyze.cancel}
        />
      )}

      {/* 분석 실패 */}
      {!analysisReport && analyze.isError && (
        <Card>
          <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 8 }}>
            분석에 실패했습니다: {analyze.error}
          </p>
          <ProgressLog messages={analyze.progressMessages} maxHeight={120} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button variant="ghost" onClick={() => setCurrentStep(1)}>
              브리프로 돌아가기
            </Button>
            <Button onClick={() => handleBriefSubmit(brief)}>
              다시 시도
            </Button>
          </div>
        </Card>
      )}

      {/* 분석 리포트 */}
      {analysisReport && (
        <>
          <CollapsibleStep step={2} label="분석 리포트" currentStep={currentStep}>
            <AnalysisReport
              report={analysisReport}
              onApprove={handleApproveAnalysis}
              onHelpRequest={(title, text) => {
                chatRef.current?.addAssistantMessage(`**${title} 항목 안내**\n${text}`)
              }}
              isApproved={analysisApproved}
            />
          </CollapsibleStep>
          <div style={backBtnRow}>
            <Button
              variant="ghost"
              className="btn-compact"
              onClick={() => handleGoBack(1)}
            >
              ← 이전 단계
            </Button>
          </div>
        </>
      )}

      {/* Step 3: 전략 메시지 */}
      <div data-step="3" />
      {analysisApproved && currentStep >= 3 && strategic.isPending && (
        <LoadingCard text="Copywriting Strategy 추출 중…" />
      )}

      {analysisApproved && currentStep >= 3 && strategicMessage && (
        <>
          <CollapsibleStep step={3} label="전략 메시지" currentStep={currentStep}>
            <StrategicMessageView
              data={strategicMessage}
              isApproved={strategicMessageApproved}
              onApprove={handleApproveStrategy}
            />
          </CollapsibleStep>
          <div style={backBtnRow}>
            <Button
              variant="ghost"
              className="btn-compact"
              onClick={handleModifyStrategy}
            >
              ← 이전 단계
            </Button>
          </div>
        </>
      )}

      {/* Step 4: 카피 생성 */}
      <div data-step="4" />
      {currentStep >= 4 &&
        strategicMessageApproved &&
        !copyResults &&
        !generateCopy.isPending && (
          <>
            <GenerationConfig
              onSubmit={handleGenerateCopy}
              isGenerating={false}
            />
            <div style={backBtnRow}>
              <Button variant="ghost" className="btn-compact" onClick={() => handleGoBack(3)}>
                ← 이전 단계
              </Button>
            </div>
          </>
        )}

      {currentStep >= 4 &&
        strategicMessageApproved &&
        generateCopy.isPending && (
          <LoadingCard text="카피 생성 중… (국가/변형 수에 따라 수 분 소요)" />
        )}

      {currentStep >= 4 && copyResults && (
        <>
          <CollapsibleStep step={4} label="카피 생성 결과" currentStep={currentStep}>
            <CopyResults
              results={copyResults}
              diagnostics={copyDiagnostics}
              onProceed={handleProceedToReview}
              readOnly={currentStep >= 5}
            />
          </CollapsibleStep>
          <div style={backBtnRow}>
            <Button
              variant="ghost"
              className="btn-compact"
              onClick={() => handleGoBack(3)}
            >
              ← 이전 단계
            </Button>
          </div>
        </>
      )}

      {/* Step 5: 검토 */}
      <div data-step="5" />
      {currentStep >= 5 &&
        selectedCopies.length > 0 &&
        !reviewResults && (
          <>
            <ReviewConfig
              selectedCopies={selectedCopies}
              skills={skillsQuery.data ?? []}
              isLoadingSkills={skillsQuery.isLoading}
              isReviewing={runReview.isPending}
              onRunReview={handleRunReview}
            />
            <div style={backBtnRow}>
              <Button variant="ghost" className="btn-compact" onClick={() => handleGoBack(4)}>
                ← 이전 단계
              </Button>
            </div>
          </>
        )}

      {currentStep >= 5 && runReview.isPending && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Spinner />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--neutral-900)' }}>
              스킬 기반 리뷰 실행 중…
            </p>
          </div>
          <ProgressLog messages={runReview.progressMessages} />
        </Card>
      )}

      {currentStep >= 5 && reviewResults && (
        <>
          <ReviewResults
            results={reviewResults}
            selectedCopies={selectedCopies}
            onReReview={handleReReview}
            onSaveAndFinish={async () => {
              setReviewCompleted(true)
              await handleSave()
              navigate('/')
            }}
          />
          <div style={backBtnRow}>
            <Button variant="ghost" className="btn-compact" onClick={() => handleGoBack(4)}>
              ← 이전 단계
            </Button>
          </div>
        </>
      )}
    </div>
  )

  /* ── Layout ── */

  return (
    <div style={pageWrap}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 className="page-title" style={{ margin: 0 }}>카피라이트 생성</h2>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {campaignId && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--neutral-500)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
              title="현재 저장된 캠페인 ID"
            >
              {campaignId.slice(0, 8)}
            </span>
          )}
          <Button
            variant="ghost"
            className="btn-compact"
            onClick={handleSave}
            disabled={saveCampaign.isPending || updateCampaign.isPending}
          >
            {saveCampaign.isPending || updateCampaign.isPending
              ? '저장 중…'
              : campaignId
                ? '업데이트'
                : '저장'}
          </Button>
          <Button
            variant="ghost"
            className="btn-compact"
            onClick={() => {
              if (confirm('진행 중인 내용을 초기화하시겠습니까?')) {
                reset()
                setSearchParams({}, { replace: true })
                navigate(0)
              }
            }}
          >
            초기화
          </Button>
        </div>
      </div>

      {/* Step indicator */}
      <Card
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          padding: '0.65rem 1rem',
          flexWrap: 'wrap',
        }}
      >
        {STEPS.map((s, idx) => {
          const isFullyCompleted = campaignStatus === 'completed' || reviewCompleted
          return (
            <span
              key={s.step}
              style={{ display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <StepIndicator
                step={s.step}
                label={s.label}
                active={!isFullyCompleted && currentStep === s.step}
                done={isFullyCompleted || currentStep > s.step}
                onClick={() => scrollToStepTop(s.step)}
              />
              {idx < STEPS.length - 1 && (
                <span style={{ color: 'var(--neutral-500)' }}>&rarr;</span>
              )}
            </span>
          )
        })}
      </Card>

      {/* 2-pane: 좌 7 (폼+결과) | 우 3 (채팅) */}
      <div style={splitWrap}>
        <SplitPane
          storageKey="copylight-v2:editor-split"
          defaultRatio={0.8}
          minLeftPx={520}
          minRightPx={220}
          left={
            <div
              ref={leftPaneRef}
              style={{
                height: '100%',
                minHeight: 0,
                overflow: 'auto',
                paddingRight: 4,
              }}
            >
              {renderLeftPane()}
            </div>
          }
          right={
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h4
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--neutral-700)',
                  marginBottom: 8,
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                AI 어시스턴트
              </h4>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ChatPanel ref={chatRef} />
              </div>
            </Card>
          }
        />
      </div>
      <style>{`@keyframes ep-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

/* ── Shared internal components ── */

function Spinner() {
  return (
    <div
      style={{
        width: 24,
        height: 24,
        border: '3px solid var(--neutral-200)',
        borderTopColor: 'var(--lg-red-600)',
        borderRadius: '50%',
        animation: 'ep-spin 0.8s linear infinite',
        flexShrink: 0,
      }}
    />
  )
}

function CollapsibleStep({
  step,
  label,
  currentStep,
  children,
}: {
  step: number
  label: string
  currentStep: number
  children: ReactNode
}) {
  const isCurrent = currentStep === step
  const isPast = currentStep > step
  const [collapsed, setCollapsed] = useState(isPast)
  const prevStepRef = useRef(currentStep)

  // currentStep이 변경되면 현재 단계만 펼치고 나머지는 모두 접기
  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      prevStepRef.current = currentStep
      setCollapsed(!isCurrent)
    }
  }, [currentStep, isCurrent])

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'var(--white)',
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '8px 12px',
          background: collapsed ? 'var(--neutral-100)' : 'var(--white)',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            background: isPast ? 'var(--success)' : 'var(--lg-red-600)',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {isPast ? '✓' : step}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-900)', flex: 1, textAlign: 'left' }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: 'var(--neutral-500)', transition: 'transform 0.2s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)' }}>
          ▾
        </span>
      </button>
      {!collapsed && (
        <div className="collapsible-step-body" style={{ padding: '8px 12px 10px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

const ANALYZE_VISUAL_STEPS = [
  { keywords: ['query', 'plann'], label: '검색 전략 수립', desc: '브리프를 분석하여 최적의 검색 키워드를 생성합니다' },
  { keywords: ['search', 'web', 'rag', 'retriev'], label: '시장 정보 수집', desc: '웹 검색과 내부 지식 베이스를 동시에 탐색합니다' },
  { keywords: ['synth', 'generat', 'report', 'complet'], label: '분석 리포트 작성', desc: '수집된 정보를 종합하여 인사이트를 도출합니다' },
]

function resolveVisualStep(messages: string[]): number {
  if (messages.length === 0) return 0
  const last = messages[messages.length - 1].toLowerCase()
  for (let i = ANALYZE_VISUAL_STEPS.length - 1; i >= 0; i--) {
    if (ANALYZE_VISUAL_STEPS[i].keywords.some((k) => last.includes(k))) return i
  }
  if (messages.length >= 4) return 2
  if (messages.length >= 2) return 1
  return 0
}

function AnalyzingCard({ messages, onCancel }: { messages: string[]; onCancel: () => void }) {
  const visualIdx = resolveVisualStep(messages)

  return (
    <div style={overlayStyle}>
      <div style={modalBoxStyle}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Spinner />
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--neutral-900)', margin: '16px 0 6px' }}>
            AI가 캠페인을 분석하고 있습니다
          </h3>
          <p style={{ fontSize: 13, color: 'var(--neutral-500)', margin: 0 }}>
            잠시만 기다려 주세요. 보통 30초~1분 정도 소요됩니다.
          </p>
        </div>

        {/* Vertical steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 32 }}>
          {ANALYZE_VISUAL_STEPS.map((s, i) => {
            const done = visualIdx > i
            const active = visualIdx === i
            const isLast = i === ANALYZE_VISUAL_STEPS.length - 1
            return (
              <div key={i} style={{ display: 'flex', gap: 16 }}>
                {/* Left: circle + connector line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      background: done ? 'var(--success)' : active ? 'var(--lg-red-600)' : 'var(--neutral-200)',
                      color: done || active ? '#fff' : 'var(--neutral-500)',
                      transition: 'all 0.4s',
                      boxShadow: active ? '0 0 0 4px rgba(165,0,52,0.15)' : 'none',
                    }}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  {!isLast && (
                    <div style={{
                      width: 2,
                      flex: 1,
                      minHeight: 24,
                      background: done ? 'var(--success)' : 'var(--neutral-200)',
                      transition: 'background 0.4s',
                    }} />
                  )}
                </div>
                {/* Right: label + desc */}
                <div style={{ paddingTop: 4, paddingBottom: isLast ? 0 : 20 }}>
                  <p style={{
                    fontSize: 14,
                    fontWeight: 700,
                    margin: 0,
                    color: active ? 'var(--lg-red-600)' : done ? 'var(--success)' : 'var(--neutral-500)',
                    transition: 'color 0.3s',
                  }}>
                    {s.label}
                    {active && <span style={{ fontWeight: 500 }}> …</span>}
                  </p>
                  <p style={{
                    fontSize: 12,
                    color: active ? 'var(--neutral-700)' : 'var(--neutral-400)',
                    margin: '3px 0 0',
                    transition: 'color 0.3s',
                  }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Cancel */}
        <div style={{ textAlign: 'center' }}>
          <Button variant="ghost" onClick={onCancel}>분석 취소</Button>
        </div>
      </div>
    </div>
  )
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(2px)',
}

const modalBoxStyle: CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: '40px 48px',
  width: 420,
  maxWidth: '90vw',
  boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
}

function ProgressLog({
  messages,
  maxHeight = 200,
}: {
  messages: string[]
  maxHeight?: number
}) {
  if (messages.length === 0) return null
  return (
    <div
      style={{
        background: 'var(--neutral-100)',
        borderRadius: 8,
        padding: '10px 12px',
        maxHeight,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {messages.map((msg, i) => (
        <p
          key={i}
          style={{
            fontSize: 12,
            color: 'var(--neutral-700)',
            fontFamily: 'JetBrains Mono, monospace',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {msg}
        </p>
      ))}
    </div>
  )
}

function LoadingCard({ text }: { text: string }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Spinner />
        <p style={{ fontSize: 14, color: 'var(--neutral-700)' }}>{text}</p>
      </div>
    </Card>
  )
}

/* ── Styles ── */

const pageWrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  height: 'calc(100vh - 64px - 2.4rem)',
  minHeight: 600,
}

const backBtnRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
}

const splitWrap: CSSProperties = {
  flex: 1,
  minHeight: 0,
  border: '1px solid var(--color-border)',
  borderRadius: 14,
  background: 'var(--white)',
  padding: 8,
  boxShadow:
    '0 8px 24px rgba(17, 17, 17, 0.04), 0 1px 2px rgba(17, 17, 17, 0.04)',
}
