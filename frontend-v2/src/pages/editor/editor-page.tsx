import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { StepIndicator } from '@/shared/ui/step-indicator'
import { SplitPane } from '@/shared/ui/split-pane'

import { BriefingForm } from '@/features/brief'
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
  const leftPaneRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<ChatPanelHandle>(null)

  /** 왼쪽 패널을 부드럽게 맨 아래로 스크롤 */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      leftPaneRef.current?.scrollTo({
        top: leftPaneRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }, 100)
  }, [])

  /** 가이드 (?) 클릭 → 채팅에 어시스턴트 메시지로 표시 */
  const handleGuideRequest = useCallback((title: string, guide: string) => {
    chatRef.current?.addAssistantMessage(`📋 **${title}** 작성 가이드\n\n${guide}`)
  }, [])

  /** 워크플로우 단계 클릭 → 해당 섹션으로 스크롤 */
  const scrollToStep = useCallback((step: number) => {
    const el = leftPaneRef.current?.querySelector(`[data-step="${step}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const campaignId = useWorkflowStore((s) => s.campaignId)
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
    scrollToBottom()
    const report = await analyze.run({
      ...submitted,
      message_matrix: messageMatrix ?? null,
    })
    if (report) {
      setAnalysisReport(report)
      scrollToBottom()
    } else if (!analyze.isError) {
      // cancelled or empty
    } else {
      setCurrentStep(1)
    }
  }

  const handleApproveAnalysis = () => {
    setAnalysisApproved(true)
    setCurrentStep(3)
    scrollToBottom()
    // 승인 즉시 전략 메시지 자동 추출
    handleExtractStrategy()
  }

  const handleModifyAnalysis = () => {
    if (
      !confirm(
        '브리프를 수정하면 분석 결과와 이후 단계가 초기화됩니다. 계속하시겠습니까?',
      )
    )
      return
    setAnalysisReport(null)
    setAnalysisApproved(false)
    setStrategicMessage(null)
    setStrategicMessageApproved(false)
    setCopyResults(null)
    setSelectedCopies([])
    setCurrentStep(1)
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
        scrollToBottom()
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
    scrollToBottom()
  }

  const handleModifyStrategy = () => {
    setStrategicMessage(null)
    setStrategicMessageApproved(false)
    setCopyResults(null)
    setSelectedCopies([])
  }

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
        scrollToBottom()
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
    scrollToBottom()
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
      scrollToBottom()
    }
  }

  /* ── Left pane: 폼 + 모든 진행 결과 (세로 스크롤) ── */

  const renderLeftPane = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Step 1: 브리프 입력 */}
      <div data-step="1" />
      <BriefingForm
        initialBrief={brief}
        onChange={(b) => setBrief(b)}
        onSubmit={handleBriefSubmit}
        onMatrixParsed={(m) => setMessageMatrix(m)}
        onGuideRequest={handleGuideRequest}
        isAnalyzing={analyze.isPending}
        isDisabled={currentStep > 1 && !!analysisReport}
      />

      {/* Step 2+: 분석 로딩 */}
      {analyze.isPending && !analysisReport && (
        <Card>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <Spinner />
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--neutral-900)',
              }}
            >
              Market Analyst 파이프라인 실행 중…
            </p>
          </div>
          <ProgressLog messages={analyze.progressMessages} />
        </Card>
      )}

      {/* Step 2+: 분석 실패 */}
      {!analysisReport && analyze.isError && (
        <Card>
          <p
            style={{
              fontSize: 13,
              color: 'var(--danger)',
              marginBottom: 8,
            }}
          >
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

      {/* Step 2: 분석 리포트 */}
      <div data-step="2" />
      {analysisReport && (
        <AnalysisReport
          report={analysisReport}
          onApprove={handleApproveAnalysis}
          onModify={handleModifyAnalysis}
          isApproved={analysisApproved}
        />
      )}

      {/* Step 3: 전략 메시지 (승인 시 자동 추출) */}
      <div data-step="3" />
      {analysisApproved && currentStep >= 3 && strategic.isPending && (
        <LoadingCard text="Copywriting Strategy 추출 중…" />
      )}

      {/* Step 3: 전략 메시지 결과 */}
      {analysisApproved && currentStep >= 3 && strategicMessage && (
        <StrategicMessageView
          data={strategicMessage}
          isApproved={strategicMessageApproved}
          onApprove={handleApproveStrategy}
          onModify={handleModifyStrategy}
        />
      )}

      {/* Step 4: 카피 생성 조건 */}
      <div data-step="4" />
      {currentStep >= 4 &&
        strategicMessageApproved &&
        !copyResults &&
        !generateCopy.isPending && (
          <GenerationConfig
            onSubmit={handleGenerateCopy}
            isGenerating={false}
          />
        )}

      {currentStep >= 4 &&
        strategicMessageApproved &&
        generateCopy.isPending && (
          <LoadingCard text="카피 생성 파이프라인 실행 중… (국가/변형 수에 따라 수 분 소요)" />
        )}

      {/* Step 4: 카피 결과 */}
      {currentStep >= 4 && copyResults && (
        <CopyResults
          results={copyResults}
          diagnostics={copyDiagnostics}
          onProceed={handleProceedToReview}
          readOnly={currentStep >= 5}
        />
      )}

      {/* Step 5: 리뷰 조건 */}
      <div data-step="5" />
      {currentStep >= 5 &&
        selectedCopies.length > 0 &&
        !reviewResults && (
          <ReviewConfig
            selectedCopies={selectedCopies}
            skills={skillsQuery.data ?? []}
            isLoadingSkills={skillsQuery.isLoading}
            isReviewing={runReview.isPending}
            onRunReview={handleRunReview}
          />
        )}

      {currentStep >= 5 && runReview.isPending && (
        <Card>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <Spinner />
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--neutral-900)',
              }}
            >
              스킬 기반 리뷰 실행 중…
            </p>
          </div>
          <ProgressLog messages={runReview.progressMessages} />
        </Card>
      )}

      {/* Step 5: 리뷰 결과 */}
      {currentStep >= 5 && reviewResults && (
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
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2 className="page-title">카피라이트 생성</h2>
          <p className="page-subtitle">
            왼쪽에서 브리프 입력 · 단계별 결과를 확인하고, 오른쪽 채팅으로
            AI 어시스턴트와 대화하세요.
          </p>
        </div>
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
        {STEPS.map((s, idx) => (
          <span
            key={s.step}
            style={{ display: 'flex', alignItems: 'center', gap: 16 }}
          >
            <StepIndicator
              step={s.step}
              label={s.label}
              active={currentStep === s.step && !(s.step === 5 && reviewCompleted)}
              done={currentStep > s.step || (s.step === 5 && reviewCompleted)}
              onClick={() => scrollToStep(s.step)}
            />
            {idx < STEPS.length - 1 && (
              <span style={{ color: 'var(--neutral-500)' }}>&rarr;</span>
            )}
          </span>
        ))}
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
  gap: 12,
  height: 'calc(100vh - 64px - 2.4rem)',
  minHeight: 600,
}

const splitWrap: CSSProperties = {
  flex: 1,
  minHeight: 0,
  border: '1px solid var(--color-border)',
  borderRadius: 14,
  background: 'var(--white)',
  padding: 12,
  boxShadow:
    '0 8px 24px rgba(17, 17, 17, 0.04), 0 1px 2px rgba(17, 17, 17, 0.04)',
}
