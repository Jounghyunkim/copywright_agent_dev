import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { useDashboard, useDeleteCampaign } from '@/shared/api/hooks'
import type { CampaignListItem } from '@/shared/api/types'
import { useWorkflowStore } from '@/shared/state/workflow-store'
import { campaignRoute } from '@/shared/lib/campaign-route'

/** 캠페인 currentStep(1~5) → workflow 단계 라벨용 i18n 키. */
const STEP_I18N_KEY: Record<number, string> = {
  1: 'workflow:step.brief',
  2: 'workflow:step.analysis',
  3: 'workflow:step.strategy',
  4: 'workflow:step.generation',
  5: 'workflow:step.review',
}

function statusTone(status: CampaignListItem['status']): 'success' | 'warning' {
  return status === 'completed' ? 'success' : 'warning'
}

export function WorkflowListPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const dashboard = useDashboard()
  const deleteCampaign = useDeleteCampaign()
  const reset = useWorkflowStore((s) => s.reset)

  const statusLabel = (status: CampaignListItem['status']): string =>
    status === 'completed'
      ? t('common:status.completed')
      : t('common:status.inProgress')

  const handleOpen = (c: CampaignListItem) => {
    navigate(campaignRoute(c))
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(t('workflow-list:deleteConfirm', { title }))) return
    try {
      await deleteCampaign.mutateAsync(id)
    } catch (err) {
      console.error('[WorkflowListPage] delete failed', err)
      alert(t('common:error.deleteFailed'))
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
          <h2 className="page-title">{t('page:workflowList.title')}</h2>
          <p className="page-subtitle">{t('page:workflowList.subtitle')}</p>
        </div>
        <Button onClick={handleNew}>{t('workflow-list:button.new')}</Button>
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
            {t('workflow-list:loading')}
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
              {t('workflow-list:loadError')}
            </p>
            <Button
              variant="ghost"
              className="btn-compact"
              onClick={() => dashboard.refetch()}
            >
              {t('common:button.retry')}
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
              {t('workflow-list:empty')}
            </p>
            <Button onClick={handleNew}>{t('workflow-list:button.new')}</Button>
          </div>
        )}
        {campaigns.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{t('workflow-list:table.projectName')}</th>
                  <th>{t('workflow-list:table.country')}</th>
                  <th>{t('workflow-list:table.step')}</th>
                  <th>{t('workflow-list:table.status')}</th>
                  <th style={{ textAlign: 'right' }}>
                    {t('workflow-list:table.brandFit')}
                  </th>
                  <th style={{ textAlign: 'right' }}>
                    {t('workflow-list:table.reviewAvg')}
                  </th>
                  <th style={{ textAlign: 'right' }}>
                    {t('workflow-list:table.createdAt')}
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const stepKey = STEP_I18N_KEY[c.currentStep]
                  const stepLabel = stepKey ? t(stepKey) : '-'
                  return (
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
                        {c.currentStep}/5 · {stepLabel}
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
                            {t('common:button.open')}
                          </Button>
                          <Button
                            variant="ghost"
                            className="btn-compact"
                            onClick={() => handleDelete(c.id, c.title)}
                            disabled={deleteCampaign.isPending}
                          >
                            {t('common:button.delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
