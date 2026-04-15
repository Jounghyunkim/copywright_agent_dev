# Stats Dashboard Page Structure

## Layout (top to bottom)

### 1. Header
- Title: "사용 통계" (or localized equivalent)
- Subtitle: "DAU / MAU 및 사용자별, 조직별 사용 현황"
- Period selector (right-aligned): `<select>` with 7일 / 14일 / 30일 / 90일

### 2. Summary Cards (3-column grid)
| Card | Label | Value | Sub-text |
|------|-------|-------|----------|
| 1 | 오늘 DAU | `summary.dau_today` | — |
| 2 | 이번 달 MAU | `summary.mau_this_month` | — |
| 3 | 전체 사용자 | `summary.total_unique_users` | `총 {total_logins}회 로그인 (성공률 {rate}%)` |

### 3. DAU Trend Chart (Card)
- **Recharts AreaChart** inside ResponsiveContainer (height: 220px)
- Gradient fill from brand color (opacity 0.15 → 0)
- X-axis: MM-DD format (strip year), font-size 11
- Y-axis: integers only (allowDecimals=false)
- Data: `GET /admin/stats/dau?days={period}`

### 4. MAU Trend Chart (Card)
- **Recharts BarChart** inside ResponsiveContainer (height: 200px)
- Bars: brand color, top-rounded (radius [4,4,0,0])
- X-axis: YY/MM format, font-size 11
- Data: `GET /admin/stats/mau`

### 5. Department Stats Table (Card)
- Columns: 조직 | 사용자 수 | 로그인 횟수 | 평균 활동일
- Numeric columns right-aligned
- Sorted by unique_users descending (server-side)
- Data: `GET /admin/stats/departments?days={period}`

### 6. User Stats Table (Card, sortable)
- Columns: 사용자(ID) | 조직 | 활동일 | 로그인 | 최근 접속
- **Client-side sorting** on: user_id, active_days, login_count, last_login
- Sort indicator: ▲ (asc) / ▼ (desc) unicode arrows
- Toggle: click same column → flip direction, click different → desc
- Date format: M/DD HH:MM (compact)
- Data: `GET /admin/stats/users?days={period}`

## TypeScript Types

```typescript
type Summary = {
  dau_today: number
  mau_this_month: number
  total_unique_users: number
  total_logins: number
  login_success_rate: number
}

type DauEntry = { date: string; count: number }
type MauEntry = { month: string; count: number }

type UserStats = {
  user_id: string
  department: string | null
  login_count: number
  active_days: number
  last_login: string | null
}

type DeptStats = {
  department: string
  unique_users: number
  login_count: number
  active_days_avg: number
}
```

## StatCard Component

```tsx
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card style={{ textAlign: 'center', padding: '20px 16px' }}>
      <div style={{ fontSize: 12, color: 'var(--neutral-600)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--neutral-900)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--neutral-500)', marginTop: 2 }}>{sub}</div>}
    </Card>
  )
}
```

## Client-Side Sorting Pattern (User Table)

```typescript
type SortKey = 'active_days' | 'login_count' | 'last_login' | 'user_id'

const [userSort, setUserSort] = useState<SortKey>('active_days')
const [userSortAsc, setUserSortAsc] = useState(false)

const sortedUsers = [...users].sort((a, b) => {
  const dir = userSortAsc ? 1 : -1
  if (userSort === 'user_id') return dir * a.user_id.localeCompare(b.user_id)
  if (userSort === 'last_login') return dir * ((a.last_login ?? '') > (b.last_login ?? '') ? 1 : -1)
  return dir * ((a[userSort] ?? 0) - (b[userSort] ?? 0))
})

function toggleSort(key: SortKey) {
  if (userSort === key) setUserSortAsc(!userSortAsc)
  else { setUserSort(key); setUserSortAsc(false) }
}

// Sort indicator
const sortIcon = (key: SortKey) =>
  userSort === key ? (userSortAsc ? ' ▲' : ' ▼') : ''
```

## Date Formatting Helpers

```typescript
function formatDate(iso: string) {
  return iso.slice(5) // "2026-04-13" → "04-13"
}

function formatMonth(ym: string) {
  const [y, m] = ym.split('-')
  return `${y.slice(2)}/${m}` // "2026-04" → "26/04"
}

function formatLastLogin(iso: string | null) {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
```

## Data Fetching Pattern

```typescript
useEffect(() => {
  apiClient.get('/admin/stats/summary').then(setSummary)
  apiClient.get(`/admin/stats/dau?days=${days}`).then(setDau)
  apiClient.get('/admin/stats/mau').then(setMau)
  apiClient.get(`/admin/stats/users?days=${days}`).then(setUsers)
  apiClient.get(`/admin/stats/departments?days=${days}`).then(setDepts)
}, [days])
```

All 5 calls fire in parallel on mount and on period change.

## Styling Conventions

- Cards: `padding: 20px 16px`
- Chart title: `fontSize: 14, marginBottom: 12`
- Grid: `className="grid-3"` for summary cards
- Empty state: `fontSize: 13, color: var(--neutral-500)`, text "데이터가 없습니다."
- Table: `className="table"`, full width, overflow-x auto
- StatCard component: centered, large value (fontSize 28, fontWeight 700)
