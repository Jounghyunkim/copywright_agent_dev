import { useNavigate } from 'react-router-dom'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { useDashboard, useDeleteCampaign } from '@/shared/api/hooks'
import type { CampaignListItem } from '@/shared/api/types'
import { useWorkflowStore } from '@/shared/state/workflow-store'
import { campaignRoute } from '@/shared/lib/campaign-route'

const STEP_LABEL: Record<number, string> = {
  1: '브리핑',
  2: '분석',
  3: '전략 메시지',
  4: '카피 생성',
  5: '검토',
}

function statusTone(status: CampaignListItem['status']): 'success' | 'warning' {
  return status === 'completed' ? 'success' : 'warning'
}

function statusLabel(status: CampaignListItem['status']): string {
  return status === 'completed' ? '완료' : '진행 중'
}

export function WorkflowListPage() {
  const navigate = useNavigate()
  const dashboard = useDashboard()
  const deleteCampaign = useDeleteCampaign()
  const reset = useWorkflowStore((s) => s.reset)

  const handleOpen = (c: CampaignListItem) => {
    navigate(campaignRoute(c))
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 캠페인을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`))
      return
    try {
      await deleteCampaign.mutateAsync(id)
    } catch (err) {
      console.error('[WorkflowListPage] delete failed', err)
      alert('삭제에 실패했습니다.')
    }
  }

  const handleNew = () => {
    reset()
    navigate('/workflow')
  }

  const campaigns = dashboard.data?.campaigns ?? []

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2 className="page-title">워크플로우 목록</h2>
          <p className="page-subtitle">
            저장된 캠페인을 열어 이어서 작업하거나 삭제하세요.
          </p>
        </div>
        <Button onClick={handleNew}>새 워크플로우</Button>
      </div>

      <Card>
        {dashboard.isLoading && (
          <p
            style={{
              fontSize: 13,
              color: 'var(--neutral-500)',
              padding: '8px 0',
            }}
          >
            캠페인 목록을 불러오는 중…
          </p>
        )}
        {dashboard.isError && (
          <div>
            <p
              style={{
                fontSize: 13,
                color: 'var(--danger)',
                marginBottom: 8,
              }}
            >
              대시보드를 불러오지 못했습니다. 백엔드 연결을 확인해 주세요.
            </p>
            <Button
              variant="ghost"
              className="btn-compact"
              onClick={() => dashboard.refetch()}
            >
              다시 시도
            </Button>
          </div>
        )}
        {!dashboard.isLoading && !dashboard.isError && campaigns.length === 0 && (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <p
              style={{
                fontSize: 13,
                color: 'var(--neutral-500)',
                marginBottom: 8,
              }}
            >
              저장된 캠페인이 없습니다.
            </p>
            <Button onClick={handleNew}>첫 워크플로우 시작</Button>
          </div>
        )}
        {campaigns.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>프로젝트명</th>
                  <th>국가</th>
                  <th>단계</th>
                  <th>상태</th>
                  <th style={{ textAlign: 'right' }}>Brand Fit</th>
                  <th style={{ textAlign: 'right' }}>Review Avg</th>
                  <th style={{ textAlign: 'right' }}>생성일</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>
                      <div>{c.title}</div>
                      {c.summary && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--neutral-500)',
                            marginTop: 2,
                            maxWidth: 360,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c.summary}
                        </div>
                      )}
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 4,
                        }}
                      >
                        {(c.countries ?? []).slice(0, 4).map((cc) => (
                          <Badge key={cc} tone="neutral">
                            {cc}
                          </Badge>
                        ))}
                        {c.countries && c.countries.length > 4 && (
                          <Badge tone="neutral">
                            +{c.countries.length - 4}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--neutral-700)' }}>
                      {c.currentStep}/5 · {STEP_LABEL[c.currentStep] ?? '-'}
                    </td>
                    <td>
                      <Badge tone={statusTone(c.status)}>
                        {statusLabel(c.status)}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {c.brandFitScore != null && c.brandFitScore > 0
                        ? `${c.brandFitScore}%`
                        : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {c.reviewAvgScore != null && c.reviewAvgScore > 0
                        ? c.reviewAvgScore
                        : '-'}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        color: 'var(--neutral-500)',
                        fontSize: 12,
                      }}
                    >
                      {c.date}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: 4,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <Button
                          variant="ghost"
                          className="btn-compact"
                          onClick={() => handleOpen(c)}
                        >
                          열기
                        </Button>
                        <Button
                          variant="ghost"
                          className="btn-compact"
                          onClick={() => handleDelete(c.id, c.title)}
                          disabled={deleteCampaign.isPending}
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
