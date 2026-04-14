import { CSSProperties, useMemo } from 'react'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { useWorkflowStore } from '@/shared/state/workflow-store'

interface Milestone {
  step: number
  label: string
  status: 'pending' | 'active' | 'done'
  detail?: string
}

/**
 * 현재 워크플로우 상태에서 milestone timeline을 파생해 표시.
 * 좌우 공간을 적게 차지하는 Card — Editor 우측 상단/Right stage에 배치하기 좋음.
 */
export function CaseTimeline({ compact = false }: { compact?: boolean }) {
  const currentStep = useWorkflowStore((s) => s.currentStep)
  const brief = useWorkflowStore((s) => s.brief)
  const analysisReport = useWorkflowStore((s) => s.analysisReport)
  const analysisApproved = useWorkflowStore((s) => s.analysisApproved)
  const strategicMessage = useWorkflowStore((s) => s.strategicMessage)
  const strategicMessageApproved = useWorkflowStore(
    (s) => s.strategicMessageApproved,
  )
  const copyResults = useWorkflowStore((s) => s.copyResults)
  const reviewResults = useWorkflowStore((s) => s.reviewResults)
  const campaignId = useWorkflowStore((s) => s.campaignId)

  const milestones: Milestone[] = useMemo(() => {
    const list: Milestone[] = []

    list.push({
      step: 1,
      label: '브리프 작성',
      status: brief.projectName.trim()
        ? currentStep > 1
          ? 'done'
          : 'active'
        : currentStep === 1
          ? 'active'
          : 'pending',
      detail: brief.projectName.trim() || '미입력',
    })

    list.push({
      step: 2,
      label: '분석 리포트',
      status: analysisApproved
        ? 'done'
        : analysisReport
          ? 'active'
          : currentStep >= 2
            ? 'active'
            : 'pending',
      detail: analysisReport
        ? `Brand Fit ${analysisReport.brandFit?.score ?? '-'}%`
        : undefined,
    })

    list.push({
      step: 3,
      label: '전략 메시지',
      status: strategicMessageApproved
        ? 'done'
        : strategicMessage
          ? 'active'
          : currentStep >= 3
            ? 'active'
            : 'pending',
      detail: strategicMessage?.coreMessage
        ? `"${truncate(strategicMessage.coreMessage, 40)}"`
        : undefined,
    })

    const totalCopies = (copyResults ?? []).reduce(
      (s, r) => s + (r.copies?.length ?? 0),
      0,
    )
    list.push({
      step: 4,
      label: '카피 생성',
      status:
        totalCopies > 0
          ? currentStep > 4
            ? 'done'
            : 'active'
          : currentStep >= 4
            ? 'active'
            : 'pending',
      detail:
        totalCopies > 0
          ? `${copyResults?.length ?? 0}개 국가 · ${totalCopies}개 카피`
          : undefined,
    })

    list.push({
      step: 5,
      label: '리뷰',
      status:
        reviewResults && reviewResults.length > 0
          ? 'done'
          : currentStep >= 5
            ? 'active'
            : 'pending',
      detail:
        reviewResults && reviewResults.length > 0
          ? `${reviewResults.length}건 리뷰`
          : undefined,
    })

    return list
  }, [
    brief,
    currentStep,
    analysisReport,
    analysisApproved,
    strategicMessage,
    strategicMessageApproved,
    copyResults,
    reviewResults,
  ])

  return (
    <Card style={{ padding: compact ? '0.9rem 1rem' : '1.2rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ color: 'var(--lg-red-600)' }}>◷</span>
          Case Timeline
        </h3>
        {campaignId ? (
          <span
            style={{
              fontSize: 11,
              color: 'var(--neutral-500)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {campaignId.slice(0, 8)}
          </span>
        ) : (
          <Badge tone="warning">미저장</Badge>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {milestones.map((m, idx) => (
          <div key={m.step} style={row}>
            <div style={markerColumn}>
              <span style={markerDot(m.status)}>
                {m.status === 'done' ? '✓' : m.step}
              </span>
              {idx < milestones.length - 1 && (
                <span style={markerLine(m.status === 'done')} />
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: 10 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color:
                    m.status === 'done'
                      ? 'var(--success)'
                      : m.status === 'active'
                        ? 'var(--neutral-900)'
                        : 'var(--neutral-500)',
                  margin: 0,
                }}
              >
                {m.label}
              </p>
              {m.detail && (
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--neutral-500)',
                    margin: '2px 0 0 0',
                  }}
                >
                  {m.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}

/* ── Styles ── */

const row: CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'stretch',
}

const markerColumn: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: 22,
}

const markerDot = (status: Milestone['status']): CSSProperties => ({
  width: 22,
  height: 22,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 11,
  fontWeight: 700,
  flexShrink: 0,
  background:
    status === 'done'
      ? 'var(--success)'
      : status === 'active'
        ? 'var(--lg-red-700)'
        : 'var(--neutral-200)',
  color:
    status === 'done' || status === 'active' ? '#fff' : 'var(--neutral-500)',
})

const markerLine = (done: boolean): CSSProperties => ({
  width: 2,
  flex: 1,
  background: done ? 'var(--success)' : 'var(--neutral-200)',
  minHeight: 8,
})
