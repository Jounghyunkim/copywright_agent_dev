import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { useDashboard } from '@/shared/api/hooks'
import { PendingApprovals } from '@/features/approval'
import { useWorkflowStore } from '@/shared/state/workflow-store'
import { campaignRoute } from '@/shared/lib/campaign-route'

export function HomePage() {
  const navigate = useNavigate()
  const dashboard = useDashboard()
  const reset = useWorkflowStore((s) => s.reset)
  const { t } = useTranslation()

  const stats = dashboard.data?.stats
  const recent = (dashboard.data?.campaigns ?? []).slice(0, 5)

  const handleNew = () => {
    reset()
    navigate('/workflow')
  }

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
          <h2 className="page-title">{t('page:home.title')}</h2>
          <p className="page-subtitle">
            {t('page:home.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Button variant="secondary" onClick={handleNew}>{t('home:button.newCampaign')}</Button>
          <Button onClick={() => navigate('/copy-review')}>{t('home:button.reviewCopy')}</Button>
        </div>
      </div>

      {/* Dashboard stats */}
      <div className="grid-3">
        <StatCard
          label={t('home:kpi.savedCampaigns')}
          value={stats?.totalProjects ?? 0}
          loading={dashboard.isLoading}
        />
        <StatCard
          label={t('home:kpi.avgBrandFit')}
          value={stats?.avgBrandScore ?? 0}
          unit="%"
          loading={dashboard.isLoading}
        />
        <StatCard
          label={t('home:kpi.avgReviewScore')}
          value={stats?.avgReviewScore ?? 0}
          loading={dashboard.isLoading}
        />
      </div>

      {/* Pending approvals */}
      <PendingApprovals limit={5} showAllLink />

      {/* Recent campaigns */}
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>{t('home:recentCampaigns')}</h3>
          <Link
            to="/workflow-list"
            style={{ fontSize: 12, color: 'var(--lg-red-600)', fontWeight: 600 }}
          >
            {t('common:link.viewAll')}
          </Link>
        </div>
        {dashboard.isLoading && (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>{t('common:loading')}</p>
        )}
        {dashboard.isError && (
          <p style={{ fontSize: 13, color: 'var(--danger)' }}>
            {t('common:error.loadFailed')}
          </p>
        )}
        {!dashboard.isLoading && !dashboard.isError && recent.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            {t('home:noCampaigns')}
          </p>
        )}
        {recent.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(campaignRoute(c))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--neutral-100)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--neutral-900)',
                      margin: 0,
                    }}
                  >
                    {c.title}
                  </p>
                  {c.summary && (
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--neutral-500)',
                        margin: '2px 0 0 0',
                        maxWidth: 560,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.summary}
                    </p>
                  )}
                </div>
                <Badge tone={c.status === 'completed' ? 'success' : 'warning'}>
                  {c.status === 'completed'
                    ? t('common:status.completed')
                    : t('common:status.stepOfTotal', { current: c.currentStep, total: 5 })}
                </Badge>
                <span
                  style={{ fontSize: 12, color: 'var(--neutral-500)' }}
                >
                  {c.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

    </>
  )
}

/* ── Internal ── */

function StatCard({
  label,
  value,
  unit,
  loading,
}: {
  label: string
  value: number | string
  unit?: string
  loading?: boolean
}) {
  return (
    <Card className="stack">
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--neutral-700)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          margin: 0,
        }}
      >
        {label}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
        }}
      >
        <span
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--lg-red-600)',
            lineHeight: 1,
          }}
        >
          {loading ? '—' : value}
        </span>
        {unit && (
          <span
            style={{
              fontSize: 14,
              color: 'var(--neutral-500)',
              fontWeight: 600,
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </Card>
  )
}
