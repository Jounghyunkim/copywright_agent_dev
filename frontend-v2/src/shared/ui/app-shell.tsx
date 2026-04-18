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

/** 심플한 선(line) 아이콘 — 1.75 stroke, round join. currentColor 상속. */
const NavIcons = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  ),
  review: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h12" />
      <path d="M4 11h8" />
      <path d="M4 16h6" />
      <circle cx="16" cy="16" r="4" />
      <path d="M19 19l2.5 2.5" />
    </svg>
  ),
  create: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
      <path d="M14 6l4 4" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 6h14" />
      <path d="M5 12h14" />
      <path d="M5 18h10" />
      <circle cx="3.2" cy="6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="3.2" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="3.2" cy="18" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  approval: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 12.5l2.5 2.5 5-5" />
    </svg>
  ),
  skills: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2.6 5.6 6 .9-4.4 4.2 1.1 6.1L12 17l-5.3 2.8 1.1-6.1L3.4 9.5l6-.9L12 3Z" />
    </svg>
  ),
} as const

const mainNav: { to: string; label: string; icon: keyof typeof NavIcons }[] = [
  { to: '/', label: '홈', icon: 'home' },
  { to: '/copy-review', label: '카피라이트 검토', icon: 'review' },
  { to: '/workflow', label: '카피라이트 생성', icon: 'create' },
  { to: '/workflow-list', label: '카피라이트 목록', icon: 'list' },
  { to: '/approvals', label: '승인 대기', icon: 'approval' },
  { to: '/skills', label: '스킬', icon: 'skills' },
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

const SIDEBAR_STATE_KEY = 'copylight-v2:sidebar-collapsed'

export function AppShell({ children }: { children: ReactNode }) {
  const health = useHealth()
  // isError → 네트워크 실패 또는 non-2xx. 초기 idle 상태(isPending && !isFetching) 전까지는
  // 토스트를 띄우지 않도록 isError로만 판단.
  const backendOffline = health.isError

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STATE_KEY) === '1'
    } catch {
      return false
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? '1' : '0')
    } catch {}
  }, [collapsed])

  /** 접힌 상태에서 NavLink 클릭 시 자동으로 펼침 */
  const handleNavClick = () => {
    if (collapsed) setCollapsed(false)
  }

  return (
    <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
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
              onClick={handleNavClick}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon" aria-hidden>
                {NavIcons[item.icon]}
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <div
          className="sidebar-footer"
          style={{
            paddingTop: 8,
            borderTop: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div className="sidebar-footer-gear">
            <GearMenu />
          </div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            aria-pressed={collapsed}
          >
            {collapsed ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            )}
          </button>
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

