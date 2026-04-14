import { Link, useNavigate } from 'react-router-dom'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { useDashboard, useHealth } from '@/shared/api/hooks'
import { PendingApprovals } from '@/features/approval'
import { useWorkflowStore } from '@/shared/state/workflow-store'
import { campaignRoute } from '@/shared/lib/campaign-route'

export function HomePage() {
  const navigate = useNavigate()
  const dashboard = useDashboard()
  const health = useHealth()
  const reset = useWorkflowStore((s) => s.reset)

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
          <h2 className="page-title">홈</h2>
          <p className="page-subtitle">
            LG 브랜드 캠페인을 위한 AI 카피라이팅 플랫폼
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Button onClick={handleNew}>새 카피라이트 생성</Button>
        </div>
      </div>

      {/* Dashboard stats */}
      <div className="grid-3">
        <StatCard
          label="저장된 캠페인"
          value={stats?.totalProjects ?? 0}
          unit="건"
          loading={dashboard.isLoading}
        />
        <StatCard
          label="평균 Brand Fit"
          value={stats?.avgBrandScore ?? 0}
          unit="%"
          loading={dashboard.isLoading}
        />
        <StatCard
          label="평균 Review 점수"
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
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>최근 캠페인</h3>
          <Link
            to="/workflow-list"
            style={{ fontSize: 12, color: 'var(--lg-red-600)', fontWeight: 600 }}
          >
            전체 보기 →
          </Link>
        </div>
        {dashboard.isLoading && (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>로드 중…</p>
        )}
        {dashboard.isError && (
          <p style={{ fontSize: 13, color: 'var(--danger)' }}>
            대시보드를 불러오지 못했습니다.
          </p>
        )}
        {!dashboard.isLoading && !dashboard.isError && recent.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            저장된 캠페인이 없습니다. 새 워크플로우를 시작해 보세요.
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
                  {c.status === 'completed' ? '완료' : `${c.currentStep}/5`}
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

      {/* System health */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          시스템 상태
        </h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge tone={health.isError ? 'danger' : 'success'}>
            Backend :5000 {health.isError ? 'offline' : 'online'}
          </Badge>
          <Badge tone="neutral">FAISS Index</Badge>
          <Badge tone="neutral">Azure OpenAI</Badge>
          <Badge tone="neutral">Tavily Search</Badge>
        </div>
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
