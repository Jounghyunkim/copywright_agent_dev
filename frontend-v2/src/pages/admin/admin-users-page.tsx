import { useEffect, useRef, useState } from 'react'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { FieldLabel, TextInput } from '@/shared/ui/field'
import { apiClient } from '@/shared/api/client'
import { useAuthStore } from '@/shared/state/auth-store'

interface AdminUser {
  user_id: string
  display_name: string
  department: string | null
  email: string | null
  added_by: string
  created_at: string
}

interface LdapResult {
  user_id: string
  display_name: string
  department: string | null
  email: string | null
  is_admin: boolean
}

export function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user)

  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  // LDAP search state
  const [password, setPassword] = useState('')
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LdapResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Load admin list
  const loadAdmins = async () => {
    try {
      const data = await apiClient.get<AdminUser[]>('/admin/users')
      setAdmins(data)
    } catch (err) {
      console.error('[AdminUsersPage] load admins failed', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  // Debounced LDAP search
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

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, passwordVerified])

  const doSearch = async (q: string) => {
    setSearching(true)
    setSearchError(null)
    try {
      const data = await apiClient.post<LdapResult[]>('/admin/users/search-ldap', {
        q,
        password,
      })
      setResults(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('401')) {
        setPasswordVerified(false)
        setPassword('')
        setSearchError('비밀번호가 올바르지 않습니다. 다시 입력해 주세요.')
      } else if (msg.includes('503')) {
        setSearchError('LDAP 서버에 연결할 수 없습니다.')
      } else {
        setSearchError('검색에 실패했습니다.')
      }
    } finally {
      setSearching(false)
    }
  }

  const handleAdd = async (user: LdapResult) => {
    setActionLoading(user.user_id)
    try {
      await apiClient.post('/admin/users', {
        user_id: user.user_id,
        display_name: user.display_name,
        department: user.department,
        email: user.email,
      })
      // Update local state
      setResults((prev) =>
        prev.map((r) =>
          r.user_id === user.user_id ? { ...r, is_admin: true } : r,
        ),
      )
      await loadAdmins()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('409')) {
        alert('이미 관리자로 등록된 사용자입니다.')
      } else {
        alert('관리자 추가에 실패했습니다.')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemove = async (admin: AdminUser) => {
    const isSelf = admin.user_id === currentUser?.user_id
    const msg = isSelf
      ? `자신(${admin.display_name})을 관리자에서 제거하시겠습니까?\n다음 로그인부터 관리자 권한이 해제됩니다.`
      : `${admin.display_name}(${admin.user_id})을 관리자에서 제거하시겠습니까?`
    if (!confirm(msg)) return

    setActionLoading(admin.user_id)
    try {
      await apiClient.delete(`/admin/users/${admin.user_id}`)
      await loadAdmins()
      // Update search results if visible
      setResults((prev) =>
        prev.map((r) =>
          r.user_id === admin.user_id ? { ...r, is_admin: false } : r,
        ),
      )
    } catch (err) {
      const msg2 = err instanceof Error ? err.message : ''
      if (msg2.includes('409')) {
        alert('마지막 관리자는 제거할 수 없습니다.')
      } else {
        alert('관리자 제거에 실패했습니다.')
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <>
      <div>
        <h2 className="page-title">관리자 설정</h2>
        <p className="page-subtitle">관리자 추가/제거 및 사용자 검색</p>
      </div>

      {/* Current admin list */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          현재 관리자 ({admins.length}명)
        </h3>
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>로드 중…</p>
        ) : admins.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            등록된 관리자가 없습니다.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>ID</th>
                  <th>조직</th>
                  <th>추가일</th>
                  <th>추가자</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.user_id}>
                    <td style={{ fontWeight: 500 }}>{a.display_name}</td>
                    <td style={{ color: 'var(--neutral-700)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                      {a.user_id}
                    </td>
                    <td style={{ color: 'var(--neutral-700)' }}>{a.department || '-'}</td>
                    <td style={{ color: 'var(--neutral-500)', fontSize: 12 }}>
                      {a.created_at?.slice(0, 10)}
                    </td>
                    <td style={{ color: 'var(--neutral-500)', fontSize: 12 }}>{a.added_by}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="ghost"
                        className="btn-compact"
                        onClick={() => handleRemove(a)}
                        disabled={actionLoading === a.user_id}
                      >
                        제거
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* LDAP user search */}
      <Card className="stack">
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>사용자 검색 (LDAP)</h3>

        {!passwordVerified ? (
          /* Phase 1: Password gate */
          <div style={{ display: 'grid', gap: 10, maxWidth: 400 }}>
            <p style={{ fontSize: 13, color: 'var(--neutral-700)' }}>
              LDAP 검색을 위해 본인 비밀번호를 입력해 주세요.
            </p>
            <div>
              <FieldLabel>비밀번호</FieldLabel>
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="LDAP 비밀번호"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && password) setPasswordVerified(true)
                }}
              />
            </div>
            {searchError && (
              <p style={{ fontSize: 13, color: 'var(--danger)' }}>{searchError}</p>
            )}
            <div>
              <Button onClick={() => setPasswordVerified(true)} disabled={!password}>
                확인
              </Button>
            </div>
          </div>
        ) : (
          /* Phase 2: Search mode */
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TextInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름 또는 ID로 검색 (2글자 이상)"
                style={{ maxWidth: 400 }}
              />
              {searching && (
                <span style={{ fontSize: 13, color: 'var(--neutral-500)' }}>검색 중…</span>
              )}
              <div style={{ flex: 1 }} />
              <button
                type="button"
                onClick={() => {
                  setPasswordVerified(false)
                  setPassword('')
                  setResults([])
                  setQuery('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--lg-red-600)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                비밀번호 재입력
              </button>
            </div>

            {searchError && (
              <p style={{ fontSize: 13, color: 'var(--danger)' }}>{searchError}</p>
            )}

            {results.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>이름</th>
                      <th>ID</th>
                      <th>조직</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.user_id}>
                        <td style={{ fontWeight: 500 }}>{r.display_name}</td>
                        <td style={{ color: 'var(--neutral-700)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                          {r.user_id}
                        </td>
                        <td style={{ color: 'var(--neutral-700)' }}>{r.department || '-'}</td>
                        <td style={{ textAlign: 'right' }}>
                          {r.is_admin ? (
                            <Badge tone="neutral">관리자</Badge>
                          ) : (
                            <Button
                              className="btn-compact"
                              onClick={() => handleAdd(r)}
                              disabled={actionLoading === r.user_id}
                            >
                              추가
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!searching && query.trim().length >= 2 && results.length === 0 && !searchError && (
              <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
                검색 결과가 없습니다.
              </p>
            )}
          </div>
        )}
      </Card>

      <Card>
        <p style={{ fontSize: 12, color: 'var(--neutral-500)' }}>
          관리자 추가/제거는 다음 로그인부터 반영됩니다.
        </p>
      </Card>
    </>
  )
}
