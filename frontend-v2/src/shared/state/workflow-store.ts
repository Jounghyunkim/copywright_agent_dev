import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type {
  AnalysisReport,
  CampaignBrief,
  CampaignDetail,
  CopyResult,
  MessageMatrixProduct,
  ReviewResult,
  SelectedCopy,
  StrategicMessageData,
} from '@/shared/api/types'
import { INITIAL_BRIEF } from '@/features/brief/sections'

export type WorkflowStep = 1 | 2 | 3 | 4 | 5

interface WorkflowState {
  /** 저장된 캠페인 ID. null 이면 아직 저장되지 않은 새 워크플로우. */
  campaignId: string | null
  currentStep: WorkflowStep
  brief: CampaignBrief
  /** Briefing 단계에서 업로드한 Message Matrix(시트별 ProductInfo). 분석 호출 시 함께 전송됨. */
  messageMatrix: Record<string, MessageMatrixProduct> | null
  analysisReport: AnalysisReport | null
  analysisApproved: boolean
  strategicMessage: StrategicMessageData | null
  strategicMessageApproved: boolean
  copyResults: CopyResult[] | null
  selectedCopies: SelectedCopy[]
  reviewResults: ReviewResult[] | null

  setCampaignId: (id: string | null) => void
  setCurrentStep: (step: WorkflowStep) => void
  setBrief: (brief: CampaignBrief) => void
  patchBrief: (patch: Partial<CampaignBrief>) => void
  setMessageMatrix: (m: Record<string, MessageMatrixProduct> | null) => void
  setAnalysisReport: (r: AnalysisReport | null) => void
  setAnalysisApproved: (approved: boolean) => void
  setStrategicMessage: (m: StrategicMessageData | null) => void
  setStrategicMessageApproved: (approved: boolean) => void
  setCopyResults: (r: CopyResult[] | null) => void
  setSelectedCopies: (c: SelectedCopy[]) => void
  setReviewResults: (r: ReviewResult[] | null) => void

  /** 캠페인 상세를 store로 복원. 로드 시 HITL 승인 상태는 현재 step에서 역추정. */
  hydrateFromCampaign: (detail: CampaignDetail) => void
  reset: () => void
}

const INITIAL: Pick<
  WorkflowState,
  | 'campaignId'
  | 'currentStep'
  | 'brief'
  | 'messageMatrix'
  | 'analysisReport'
  | 'analysisApproved'
  | 'strategicMessage'
  | 'strategicMessageApproved'
  | 'copyResults'
  | 'selectedCopies'
  | 'reviewResults'
> = {
  campaignId: null,
  currentStep: 1,
  brief: INITIAL_BRIEF,
  messageMatrix: null,
  analysisReport: null,
  analysisApproved: false,
  strategicMessage: null,
  strategicMessageApproved: false,
  copyResults: null,
  selectedCopies: [],
  reviewResults: null,
}

function clampStep(step: number): WorkflowStep {
  if (step <= 1) return 1
  if (step >= 5) return 5
  return step as WorkflowStep
}

/**
 * Workflow-scope store.
 * - persist: 브라우저 새로고침 시에도 진행 중인 브리프/결과 유지
 * - reset(): 명시적으로 초기화할 때만 호출 (예: "새 워크플로우" 버튼)
 */
export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set) => ({
      ...INITIAL,
      setCampaignId: (campaignId) => set({ campaignId }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      setBrief: (brief) => set({ brief }),
      patchBrief: (patch) =>
        set((s) => ({ brief: { ...s.brief, ...patch } })),
      setMessageMatrix: (messageMatrix) => set({ messageMatrix }),
      setAnalysisReport: (analysisReport) => set({ analysisReport }),
      setAnalysisApproved: (analysisApproved) => set({ analysisApproved }),
      setStrategicMessage: (strategicMessage) => set({ strategicMessage }),
      setStrategicMessageApproved: (strategicMessageApproved) =>
        set({ strategicMessageApproved }),
      setCopyResults: (copyResults) => set({ copyResults }),
      setSelectedCopies: (selectedCopies) => set({ selectedCopies }),
      setReviewResults: (reviewResults) => set({ reviewResults }),
      hydrateFromCampaign: (d) =>
        set({
          campaignId: d.id,
          currentStep: clampStep(d.currentStep),
          brief: d.brief,
          messageMatrix: null,
          analysisReport: d.analysisReport,
          // step이 2 이상이면 분석 결과가 승인되었다고 간주
          analysisApproved: d.currentStep >= 3 && !!d.analysisReport,
          strategicMessage: d.strategicMessage,
          strategicMessageApproved:
            d.currentStep >= 4 && !!d.strategicMessage,
          copyResults: d.copyResults,
          selectedCopies: [],
          reviewResults: d.reviewResults,
        }),
      reset: () => set(INITIAL),
    }),
    {
      name: 'copylight-v2:workflow',
      version: 1,
    },
  ),
)
