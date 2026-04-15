# Admin Users Page Structure (React + TypeScript)

## TypeScript Types

```typescript
type AdminUser = {
  user_id: string
  display_name: string
  department: string | null
  email: string | null
  added_by: string
  created_at: string
}

type LdapResult = {
  user_id: string
  display_name: string
  department: string | null
  email: string | null
  is_admin: boolean
}
```

## Page Layout (top to bottom)

### 1. Header
- Title: "관리자 추가/제거"
- Subtitle: "관리자 추가/제거 및 사용자 검색"

### 2. Current Admin List (Card)
- `GET /admin/users` on mount
- Table columns: 이름 | ID | 조직 | 추가일 | 추가자 | (제거 버튼)
- 제거 버튼: confirm dialog → `DELETE /admin/users/{user_id}`

### 3. User Search (Card, two-phase)

**Phase 1: Password Gate (비밀번호 미인증 상태)**
- Label: "LDAP 검색을 위해 본인 비밀번호를 입력해주세요"
- Password input + "확인" button
- Submit → `passwordVerified = true`

**Phase 2: Search Mode (비밀번호 인증 후)**
- Text input: "이름 또는 ID로 검색 (2글자 이상)"
- "비밀번호 재입력" 링크 (passwordVerified 초기화)
- Debounced search (500ms)
- Results table: 이름 | ID | 조직 | (추가 버튼 or "관리자" 뱃지)

## State Management

```typescript
const [admins, setAdmins] = useState<AdminUser[]>([])
const [query, setQuery] = useState('')
const [password, setPassword] = useState('')
const [passwordVerified, setPasswordVerified] = useState(false)
const [results, setResults] = useState<LdapResult[]>([])
const [searching, setSearching] = useState(false)
const [searchError, setSearchError] = useState<string | null>(null)
const [actionLoading, setActionLoading] = useState<string | null>(null)  // user_id being processed
```

## API Calls

```typescript
// Load admin list
apiClient.get<AdminUser[]>('/admin/users')

// Search LDAP (POST — password in body)
apiClient.post<LdapResult[]>('/admin/users/search-ldap', { q: query, password })

// Add admin (profile info from search result)
apiClient.post('/admin/users', {
  user_id: user.user_id,
  display_name: user.display_name,
  department: user.department,
  email: user.email,
})

// Remove admin
apiClient.delete(`/admin/users/${userId}`)
```

## Debounced Search Pattern

```typescript
const debounceRef = useRef<ReturnType<typeof setTimeout>>()

useEffect(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current)
  setSearchError(null)

  if (!passwordVerified || query.trim().length < 2) {
    setResults([])
    return
  }

  debounceRef.current = setTimeout(() => {
    doSearch(query.trim())
  }, 500)

  return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
}, [query, passwordVerified])
```

## Error Handling

| API 에러 | 프론트 동작 |
|----------|-----------|
| 401 (invalid_ldap_password) | `passwordVerified = false`, 비밀번호 재입력 유도 |
| 503 (ldap_unavailable) | "LDAP 서버에 연결할 수 없습니다." |
| 409 (user_already_admin) | "이미 관리자로 등록된 사용자입니다." |
| 409 (cannot_remove_last_admin) | "마지막 관리자는 제거할 수 없습니다." |
| 404 (admin_not_found) | "관리자를 찾을 수 없습니다." |

## Remove Confirmation Dialogs

```typescript
// Self-removal
const msg = isSelf
  ? `자신(${displayName})을 관리자에서 제거하시겠습니까?\n다음 로그인부터 관리자 권한이 해제됩니다.`
  : `${displayName}(${userId})을 관리자에서 제거하시겠습니까?`
if (!confirm(msg)) return
```

## Admin-Conditional Navigation (GearMenu / Sidebar)

```typescript
// Only show admin links if user has admin role
const user = useUIStore.getState().user
const isAdmin = user?.roles?.includes('admin')

// In menu items:
...(isAdmin
  ? [{ label: '관리자 추가/제거', path: '/admin/users' }]
  : [])
```

## Search Result: Add vs Badge

```tsx
{r.is_admin ? (
  <Badge tone="neutral">관리자</Badge>
) : (
  <Button onClick={() => handleAdd(r)}>추가</Button>
)}
```

After adding, update local results state to flip `is_admin: true` (no re-fetch needed).
