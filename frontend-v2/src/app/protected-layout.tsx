import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import { apiClient } from '@/shared/api/client'
import { useAuthStore } from '@/shared/state/auth-store'
import type { UserInfo } from '@/shared/api/types'

/**
 * Auth guard — 마운트 시 GET /auth/me 호출.
 * 인증 성공 시 자식 라우트(Outlet) 렌더, 실패 시 /login 리디렉트.
 */
export function ProtectedLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [checking, setChecking] = useState(!user)

  useEffect(() => {
    if (user) {
      setChecking(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const me = await apiClient.get<UserInfo>('/auth/me')
        if (!cancelled) {
          setUser(me)
          setChecking(false)
        }
      } catch {
        if (!cancelled) {
          navigate('/login', { replace: true })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, setUser, navigate])

  if (checking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--neutral-500)',
          fontSize: 14,
        }}
      >
        인증 확인 중…
      </div>
    )
  }

  return <Outlet />
}
