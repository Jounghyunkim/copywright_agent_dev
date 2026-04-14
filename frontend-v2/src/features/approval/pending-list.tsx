import { CSSProperties, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { useDashboard } from '@/shared/api/hooks'
import type { CampaignListItem } from '@/shared/api/types'

export interface PendingApproval {
  campaignId: string
  title: string
  summary?: string
  date: string
  /** 대기 중인 HITL 단계 */
  stage: 'analysis' | 'strategy' | 'copy-review'
  /** 다음으로 이동할 step (Editor에서 표시) */
  targetStep: number
}

/**
 * Dashboard 데이터에서 "사용자 액션 대기" 상태를 추정.
 * - currentStep === 2 이고 brandFitScore > 0 → 분석 결과 승인 대기
 * - currentStep === 3 → 전략 메시지 승인 대기 (스토어 보존된 경우)
 * - currentStep === 4 이고 totalCopies > 0 → 카피 선택/리뷰 대기
 */
export function derivePendingApprovals(
  campaigns: CampaignListItem[],
): PendingApproval[] {
  const out: PendingApproval[] = []
  for (const c of campaigns) {
    if (c.status === 'completed') continue
    if (c.currentStep === 2 && (c.brandFitScore ?? 0) > 0) {
      out.push({
        campaignId: c.id,
        title: c.title,
        summary: c.summary,
        date: c.date,
        stage: 'analysis',
        targetStep: 2,
      })
    } else if (c.currentStep === 3) {
      out.push({
        campaignId: c.id,
        title: c.title,
        summary: c.summary,
        date: c.date,
        stage: 'strategy',
        targetStep: 3,
      })
    } else if (c.currentStep === 4 && (c.totalCopies ?? 0) > 0) {
      out.push({
        campaignId: c.id,
        title: c.title,
        summary: c.summary,
        date: c.date,
        stage: 'copy-review',
        targetStep: 4,
      })
    }
  }
  return out
}

const STAGE_META: Record<
  PendingApproval['stage'],
  { label: string; tone: 'primary' | 'warning' | 'success'; hint: string }
> = {
  analysis: {
    label: '분석 승인',
    tone: 'warning',
    hint: 'Market Analyst Report 승인/수정 필요',
  },
  strategy: {
    label: '전략 승인',
    tone: 'primary',
    hint: 'Copywriting Strategy 승인/재추출 필요',
  },
  'copy-review': {
    label: '카피 리뷰',
    tone: 'success',
    hint: '생성된 카피를 선택해 리뷰를 진행',
  },
}

interface Props {
  /** 최대 표시 개수. undefined 면 전체. */
  limit?: number
  /** 헤더의 제목. 기본값: "승인 대기". */
  title?: string
  /** "전체 보기" 링크 표시 여부 (Home 위젯에서 true). */
  showAllLink?: boolean
}

/** 공용 위젯 — Home 및 Approvals 페이지에서 재사용. */
export function PendingApprovals({
  limit,
  title = '승인 대기',
  showAllLink = false,
}: Props) {
  const navigate = useNavigate()
  const dashboard = useDashboard()

  const items = useMemo(
    () => derivePendingApprovals(dashboard.data?.campaigns ?? []),
    [dashboard.data],
  )
  const shown = typeof limit === 'number' ? items.slice(0, limit) : items

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>
          {title} <Badge tone="primary">{items.length}</Badge>
        </h3>
        {showAllLink && items.length > 0 && (
          <Button
            variant="ghost"
            className="btn-compact"
            onClick={() => navigate('/approvals')}
          >
            전체 보기 →
          </Button>
        )}
      </div>

      {dashboard.isLoading && (
        <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>로드 중…</p>
      )}
      {dashboard.isError && (
        <p style={{ fontSize: 13, color: 'var(--danger)' }}>
          대시보드를 불러오지 못했습니다.
        </p>
      )}
      {!dashboard.isLoading && !dashboard.isError && items.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
          승인 대기 중인 항목이 없습니다.
        </p>
      )}
      {shown.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shown.map((item) => {
            const meta = STAGE_META[item.stage]
            return (
              <div
                key={`${item.campaignId}-${item.stage}`}
                onClick={() =>
                  navigate(`/workflow?campaignId=${item.campaignId}`)
                }
                style={rowStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--neutral-100)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <strong style={{ fontSize: 14 }}>{item.title}</strong>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--neutral-500)',
                      }}
                    >
                      Step {item.targetStep}/5
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--neutral-700)',
                      margin: '4px 0 0 0',
                    }}
                  >
                    {meta.hint}
                    {item.summary && ` · ${item.summary}`}
                  </p>
                </div>
                <span
                  style={{ fontSize: 12, color: 'var(--neutral-500)' }}
                >
                  {item.date}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid var(--color-border)',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
}
