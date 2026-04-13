/**
 * AppShell skeleton for Marketing AX projects.
 *
 * Provides:
 * - Left sidebar (260px, LG Red gradient, sticky)
 * - Top bar (frosted glass, user info)
 * - Main content area (padded grid)
 * - Server connection failure toast
 *
 * Customize:
 * - mainNav: 프로젝트별 메인 네비게이션 항목
 * - brand-title: 프로젝트 제목
 * - topbar 우측: 유저 정보 표시
 * - GearMenu: 설정/관리 메뉴 (admin 조건부 포함)
 */

import { NavLink, useNavigate } from 'react-router-dom'
import { ReactNode, useState, useRef, useEffect } from 'react'
import { Toast } from '@/shared/ui/toast'

// ── 프로젝트별 수정 포인트 ──

const BRAND_TITLE = '__PROJECT_TITLE__'

const mainNav = [
  { to: '/home', label: '홈' },
  // 프로젝트별 메뉴 추가
]

// ── GearMenu (설정 드롭다운) ──

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

  const menuItems = [
    // admin 조건부:
    // ...(user?.roles?.includes('admin') ? [{ label: '사용 통계', path: '/admin/stats' }] : []),
    { label: '설정', path: '/settings' },
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
          width: 36, height: 36,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: '#fff',
        }}
        title="설정 메뉴"
      >
        &#9881;
      </button>
      {open && (
        <div style={{
          position: 'absolute', bottom: 44, left: 0,
          background: '#fff',
          border: '1px solid var(--color-border, #e5e7eb)',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          minWidth: 160, overflow: 'hidden', zIndex: 100,
        }}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => { navigate(item.path); setOpen(false) }}
              style={{
                display: 'block', width: '100%',
                padding: '10px 16px',
                background: 'none', border: 'none',
                textAlign: 'left', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                color: 'var(--neutral-900)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--neutral-100)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
            >
              {item.label}
            </button>
          ))}
          {/* 로그아웃 버튼 (인증 시스템이 있는 경우) */}
          {/*
          <div style={{ borderTop: '1px solid var(--color-border, #e5e7eb)' }}>
            <button
              type="button"
              onClick={async () => {
                try { await apiClient.post('/auth/logout') } catch {}
                window.location.href = '/login'
              }}
              style={{
                display: 'block', width: '100%',
                padding: '10px 16px',
                background: 'none', border: 'none',
                textAlign: 'left', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                color: 'var(--color-danger, #d32f2f)',
              }}
            >
              로그아웃
            </button>
          </div>
          */}
        </div>
      )}
    </div>
  )
}

// ── AppShell ──

export function AppShell({ children }: { children: ReactNode }) {
  // 서버 연결 상태 (SSE 등 실시간 연결이 있는 경우)
  const sseConnected = true // useUIStore((s) => s.sseConnected)

  return (
    <div className="app-shell">
      <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 12 }}>
          <h1 className="brand-title">{BRAND_TITLE}</h1>
        </div>
        <nav className="nav-list" style={{ flex: 1 }}>
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
        <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <GearMenu />
        </div>
      </aside>
      <div className="layout-main">
        <header className="topbar">
          <div>
            <strong>{BRAND_TITLE}</strong>
          </div>
          {/* 유저 정보 표시 영역 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-900)' }}>
              {/* user?.display_name */}
            </span>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
      {/* 서버 연결 실패 토스트 */}
      <Toast
        open={!sseConnected}
        variant="destructive"
        title="서버 연결 끊김"
        description="실시간 연결이 끊어졌습니다. 데이터가 자동 갱신되지 않을 수 있습니다."
      />
    </div>
  )
}
