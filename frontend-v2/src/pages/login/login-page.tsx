import { CSSProperties, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { apiClient } from '@/shared/api/client'
import { useAuthStore } from '@/shared/state/auth-store'
import type { LoginResponse, UserInfo } from '@/shared/api/types'

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const { t } = useTranslation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return

    setError(null)
    setLoading(true)

    try {
      await apiClient.post<LoginResponse>('/auth/login', {
        username: username.trim(),
        password,
      })

      // 로그인 성공 → /auth/me로 전체 사용자 정보 로드
      const me = await apiClient.get<UserInfo>('/auth/me')
      setUser(me)
      navigate('/', { replace: true })
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t('auth:error.loginFailed')
      if (msg.includes('401')) {
        setError(t('auth:error.credentialsInvalid'))
      } else if (msg.includes('503')) {
        setError(t('auth:error.serverUnavailable'))
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={pageStyle}>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--lg-red-700)', margin: 0 }}>
            Copywriting Agent
          </h1>
          <p style={{ fontSize: 13, color: 'var(--neutral-500)', marginTop: 6 }}>
            Marketing AX Platform
          </p>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={labelStyle}>{t('auth:label.employeeId')}</label>
            <input
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth:placeholder.employeeId')}
              autoFocus
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('auth:label.password')}</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth:placeholder.ldapPassword')}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0 }}>
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || !username.trim() || !password}
            style={{ width: '100%', padding: '12px', fontSize: 15 }}
          >
            {loading ? t('auth:button.signingIn') : t('auth:button.signIn')}
          </Button>
        </div>

        <p style={{ fontSize: 11, color: 'var(--neutral-500)', textAlign: 'center', marginTop: 20 }}>
          {t('auth:notice.ldap')}
        </p>
      </form>
    </div>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    'radial-gradient(circle at top right, rgba(215, 24, 42, 0.08), transparent 45%), radial-gradient(circle at bottom left, rgba(109, 0, 15, 0.08), transparent 40%), var(--color-surface-subtle)',
}

const cardStyle: CSSProperties = {
  width: 380,
  maxWidth: '90vw',
  background: 'var(--white)',
  borderRadius: 16,
  padding: '36px 32px',
  boxShadow: '0 20px 60px rgba(17, 17, 17, 0.1), 0 2px 8px rgba(17, 17, 17, 0.06)',
  border: '1px solid var(--color-border)',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--neutral-900)',
  marginBottom: 6,
}
