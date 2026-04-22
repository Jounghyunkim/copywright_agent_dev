import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card } from '@/shared/ui/card'
import { apiClient } from '@/shared/api/client'

const BRAND_COLOR = '#c60021'

interface StatsSummary {
  dau_today: number
  mau_this_month: number
  total_unique_users: number
  total_logins: number
  login_success_rate: number
}

interface DauEntry {
  date: string
  count: number
}

interface MauEntry {
  month: string
  count: number
}

interface UserStatsEntry {
  user_id: string
  display_name: string | null
  department: string | null
  login_count: number
  active_days: number
  last_login: string | null
}

interface DepartmentStatsEntry {
  department: string
  unique_users: number
  login_count: number
  active_days_avg: number
}

const PERIOD_OPTIONS: { labelKey: string; value: number }[] = [
  { labelKey: 'stats:period.7d', value: 7 },
  { labelKey: 'stats:period.14d', value: 14 },
  { labelKey: 'stats:period.30d', value: 30 },
  { labelKey: 'stats:period.90d', value: 90 },
]

type UserSortKey = 'active_days' | 'login_count' | 'last_login' | 'user_id'

function formatDayTick(iso: string) {
  // "YYYY-MM-DD" → "M/D"
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`
}

function formatMonthTick(ym: string) {
  // "YYYY-MM" → "YY/M"
  const parts = ym.split('-')
  if (parts.length !== 2) return ym
  return `${parts[0].slice(2)}/${parseInt(parts[1], 10)}`
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yy}-${mm}-${dd} ${hh}:${mi}`
}

export function StatsPage() {
  const { t } = useTranslation(['stats', 'admin', 'common', 'page'])
  const [days, setDays] = useState(30)
  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [dau, setDau] = useState<DauEntry[]>([])
  const [mau, setMau] = useState<MauEntry[]>([])
  const [users, setUsers] = useState<UserStatsEntry[]>([])
  const [departments, setDepartments] = useState<DepartmentStatsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userSort, setUserSort] = useState<UserSortKey>('active_days')
  const [userSortDesc, setUserSortDesc] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      apiClient.get<StatsSummary>('/admin/stats/summary'),
      apiClient.get<DauEntry[]>(`/admin/stats/dau?days=${days}`),
      apiClient.get<MauEntry[]>('/admin/stats/mau?months=12'),
      apiClient.get<UserStatsEntry[]>(`/admin/stats/users?days=${days}`),
      apiClient.get<DepartmentStatsEntry[]>(`/admin/stats/departments?days=${days}`),
    ])
      .then(([s, d, m, u, dept]) => {
        if (cancelled) return
        setSummary(s)
        setDau(d)
        setMau(m)
        setUsers(u)
        setDepartments(dept)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('[StatsPage] load failed', err)
        setError(t('stats:error.loadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [days, t])

  const sortedUsers = useMemo(() => {
    const arr = [...users]
    arr.sort((a, b) => {
      let cmp = 0
      if (userSort === 'active_days') cmp = a.active_days - b.active_days
      else if (userSort === 'login_count') cmp = a.login_count - b.login_count
      else if (userSort === 'last_login') {
        const av = a.last_login ? new Date(a.last_login).getTime() : 0
        const bv = b.last_login ? new Date(b.last_login).getTime() : 0
        cmp = av - bv
      } else if (userSort === 'user_id') cmp = a.user_id.localeCompare(b.user_id)
      return userSortDesc ? -cmp : cmp
    })
    return arr
  }, [users, userSort, userSortDesc])

  const toggleSort = (key: UserSortKey) => {
    if (userSort === key) setUserSortDesc((v) => !v)
    else {
      setUserSort(key)
      setUserSortDesc(key !== 'user_id')
    }
  }

  const sortIcon = (key: UserSortKey) => (userSort === key ? (userSortDesc ? ' ▼' : ' ▲') : '')

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 className="page-title">{t('page:stats.title')}</h2>
          <p className="page-subtitle">{t('page:stats.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>
            {t('stats:period.label')}
          </span>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDays(opt.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                background: days === opt.value ? 'var(--lg-red-600)' : '#fff',
                color: days === opt.value ? '#fff' : 'var(--neutral-700)',
              }}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card>
          <p style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</p>
        </Card>
      )}

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        <SummaryCard
          label={t('stats:kpi.dauToday')}
          value={summary?.dau_today ?? (loading ? '…' : 0)}
        />
        <SummaryCard
          label={t('stats:kpi.mauThisMonth')}
          value={summary?.mau_this_month ?? (loading ? '…' : 0)}
        />
        <SummaryCard
          label={t('stats:kpi.totalUsers')}
          value={summary?.total_unique_users ?? (loading ? '…' : 0)}
        />
        <SummaryCard
          label={t('stats:kpi.totalLogins')}
          value={summary?.total_logins ?? (loading ? '…' : 0)}
        />
        <SummaryCard
          label={t('stats:kpi.loginSuccessRate')}
          value={summary ? `${summary.login_success_rate}%` : loading ? '…' : '0%'}
        />
      </div>

      {/* DAU chart */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
          {t('stats:dauTrend', { days })}
        </h3>
        {dau.length === 0 && !loading ? (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            {t('common:noData')}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dau} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND_COLOR} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={BRAND_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" tickFormatter={formatDayTick} fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke={BRAND_COLOR}
                fill="url(#dauGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* MAU chart */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
          {t('stats:mauTrend')}
        </h3>
        {mau.length === 0 && !loading ? (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            {t('common:noData')}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mau} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="month" tickFormatter={formatMonthTick} fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill={BRAND_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Department table */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          {t('stats:deptActivity', { days })}
        </h3>
        {departments.length === 0 && !loading ? (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            {t('common:noData')}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>{t('stats:table.department')}</th>
                  <th style={{ textAlign: 'right' }}>
                    {t('stats:table.uniqueUsers')}
                  </th>
                  <th style={{ textAlign: 'right' }}>
                    {t('stats:table.loginCount')}
                  </th>
                  <th style={{ textAlign: 'right' }}>
                    {t('stats:table.activeDaysAvg')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.department}>
                    <td style={{ fontWeight: 500 }}>{d.department}</td>
                    <td style={{ textAlign: 'right' }}>{d.unique_users}</td>
                    <td style={{ textAlign: 'right' }}>{d.login_count}</td>
                    <td style={{ textAlign: 'right' }}>{d.active_days_avg.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* User table */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          {t('stats:userActivity', { days, count: users.length })}
        </h3>
        {users.length === 0 && !loading ? (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            {t('common:noData')}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <SortTh
                    label={`${t('admin:table.id')}${sortIcon('user_id')}`}
                    onClick={() => toggleSort('user_id')}
                  />
                  <th>{t('stats:table.department')}</th>
                  <SortTh
                    label={`${t('stats:table.activeDays')}${sortIcon('active_days')}`}
                    onClick={() => toggleSort('active_days')}
                    align="right"
                  />
                  <SortTh
                    label={`${t('stats:table.logins')}${sortIcon('login_count')}`}
                    onClick={() => toggleSort('login_count')}
                    align="right"
                  />
                  <SortTh
                    label={`${t('stats:table.lastLogin')}${sortIcon('last_login')}`}
                    onClick={() => toggleSort('last_login')}
                    align="right"
                  />
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u) => (
                  <tr key={u.user_id}>
                    <td
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 12,
                        color: 'var(--neutral-700)',
                      }}
                    >
                      {u.user_id}
                    </td>
                    <td style={{ color: 'var(--neutral-700)' }}>{u.department || '-'}</td>
                    <td style={{ textAlign: 'right' }}>{u.active_days}</td>
                    <td style={{ textAlign: 'right' }}>{u.login_count}</td>
                    <td
                      style={{
                        textAlign: 'right',
                        color: 'var(--neutral-500)',
                        fontSize: 12,
                      }}
                    >
                      {formatDateTime(u.last_login)}
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

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <p style={{ fontSize: 12, color: 'var(--neutral-500)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--neutral-900)' }}>{value}</p>
    </Card>
  )
}

function SortTh({
  label,
  onClick,
  align = 'left',
}: {
  label: string
  onClick: () => void
  align?: 'left' | 'right'
}) {
  return (
    <th style={{ textAlign: align, cursor: 'pointer', userSelect: 'none' }} onClick={onClick}>
      {label}
    </th>
  )
}
