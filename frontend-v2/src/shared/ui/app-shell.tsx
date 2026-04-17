/**
 * AppShell — LG Copywriting Agent Marketing AX layout
 * - Left sidebar (260px, LG Red gradient)
 * - Top bar (frosted glass)
 * - Main content outlet
 * - Server connection toast (react-query useHealth)
 */

import { NavLink, useNavigate } from 'react-router-dom'
import { ReactNode, useEffect, useRef, useState } from 'react'

import { Toast } from '@/shared/ui/toast'
import { Badge } from '@/shared/ui/badge'
import { useHealth } from '@/shared/api/hooks'
import { apiClient } from '@/shared/api/client'
import { useAuthStore } from '@/shared/state/auth-store'

const BRAND_TITLE = 'Copywriting Agent'
const BRAND_SUB = 'Marketing AX Platform'

const mainNav = [
  { to: '/', label: '홈' },
  { to: '/copy-review', label: '카피라이트 검토' },
  { to: '/workflow', label: '카피라이트 생성' },
  { to: '/workflow-list', label: '카피라이트 목록' },
  { to: '/approvals', label: '승인 대기' },
  { to: '/skills', label: '스킬' },
]

function GearMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roles?.includes('admin')

  const menuItems = [
    ...(isAdmin
      ? [
          { label: '관리자 설정', path: '/admin/users' },
          { label: '사용 통계', path: '/admin/stats' },
          { label: '지식 구축', path: '/admin/knowledge' },
        ]
      : []),
    { label: '일반 설정', path: '/settings' },
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'none',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 8,
          width: 36,
          height: 36,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          color: '#fff',
        }}
        title="설정 메뉴"
      >
        &#9881;
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 44,
            left: 0,
            background: '#fff',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            minWidth: 160,
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                navigate(item.path)
                setOpen(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--neutral-900)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--neutral-100)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const health = useHealth()
  // isError → 네트워크 실패 또는 non-2xx. 초기 idle 상태(isPending && !isFetching) 전까지는
  // 토스트를 띄우지 않도록 isError로만 판단.
  const backendOffline = health.isError

  return (
    <div className="app-shell">
      <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 8 }}>
          <h1 className="brand-title">{BRAND_TITLE}</h1>
          <p className="brand-sub">{BRAND_SUB}</p>
        </div>
        <nav className="nav-list">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <GearMenu />
        </div>
      </aside>
      <div className="layout-main">
        <header className="topbar">
          <div>
            <strong>{BRAND_TITLE}</strong>
          </div>
          <TopbarUser />
        </header>
        <main className="page-content">{children}</main>
      </div>
      <Toast
        open={backendOffline}
        variant="destructive"
        title="서버 연결 끊김"
        description="백엔드(:5000) 응답이 없습니다. 데이터가 자동 갱신되지 않을 수 있습니다."
      />
    </div>
  )
}

function TopbarUser() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearUser = useAuthStore((s) => s.clearUser)

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // best-effort
    }
    clearUser()
    navigate('/login', { replace: true })
  }

  if (!user) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-900)' }}>
        {user.display_name}
      </span>
      {user.department && (
        <Badge tone="neutral">{user.department}</Badge>
      )}
      <button
        type="button"
        onClick={handleLogout}
        style={{
          background: 'none',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--neutral-700)',
          cursor: 'pointer',
        }}
      >
        로그아웃
      </button>
    </div>
  )
}

