import { useEffect, useMemo, useState } from 'react'
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

const PERIOD_OPTIONS: { label: string; value: number }[] = [
  { label: '7일', value: 7 },
  { label: '14일', value: 14 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
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
        setError('통계 데이터를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [days])

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
          <h2 className="page-title">사용 통계</h2>
          <p className="page-subtitle">DAU / MAU, 조직별 / 개인별 활동 대시보드</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>기간:</span>
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
              {opt.label}
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
        <SummaryCard label="오늘 DAU" value={summary?.dau_today ?? (loading ? '…' : 0)} />
        <SummaryCard label="이번 달 MAU" value={summary?.mau_this_month ?? (loading ? '…' : 0)} />
        <SummaryCard label="누적 사용자" value={summary?.total_unique_users ?? (loading ? '…' : 0)} />
        <SummaryCard label="누적 로그인" value={summary?.total_logins ?? (loading ? '…' : 0)} />
        <SummaryCard
          label="로그인 성공률"
          value={summary ? `${summary.login_success_rate}%` : loading ? '…' : '0%'}
        />
      </div>

      {/* DAU chart */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
          DAU 추이 (최근 {days}일)
        </h3>
        {dau.length === 0 && !loading ? (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>데이터가 없습니다.</p>
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
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>MAU 추이 (최근 12개월)</h3>
        {mau.length === 0 && !loading ? (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>데이터가 없습니다.</p>
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
          조직별 활동 (최근 {days}일)
        </h3>
        {departments.length === 0 && !loading ? (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>데이터가 없습니다.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>조직</th>
                  <th style={{ textAlign: 'right' }}>사용자 수</th>
                  <th style={{ textAlign: 'right' }}>로그인 횟수</th>
                  <th style={{ textAlign: 'right' }}>평균 활동일</th>
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
          개인별 활동 (최근 {days}일, {users.length}명)
        </h3>
        {users.length === 0 && !loading ? (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>데이터가 없습니다.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <SortTh label={`ID${sortIcon('user_id')}`} onClick={() => toggleSort('user_id')} />
                  <th>조직</th>
                  <SortTh
                    label={`활동일${sortIcon('active_days')}`}
                    onClick={() => toggleSort('active_days')}
                    align="right"
                  />
                  <SortTh
                    label={`로그인${sortIcon('login_count')}`}
                    onClick={() => toggleSort('login_count')}
                    align="right"
                  />
                  <SortTh
                    label={`최근 접속${sortIcon('last_login')}`}
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
