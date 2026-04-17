import { CSSProperties } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/shared/state/auth-store'

interface TabDef {
  to: string
  label: string
  adminOnly?: boolean
}

const TABS: TabDef[] = [
  { to: '/settings', label: '일반 설정' },
  { to: '/admin/users', label: '관리자 설정', adminOnly: true },
  { to: '/admin/stats', label: '사용 통계', adminOnly: true },
  { to: '/admin/knowledge', label: '지식 구축', adminOnly: true },
]

/**
 * 설정 섹션 공통 레이아웃.
 * 좌측 기어 메뉴에서 들어온 4개 설정 페이지 상단에 탭 네비를 렌더한다.
 */
export function SettingsLayout() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = !!user?.roles?.includes('admin')
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin)

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}
    >
      <nav aria-label="설정" style={navStyle}>
        {visibleTabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end
            className={({ isActive }) =>
              `settings-tab${isActive ? ' active' : ''}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}

const navStyle: CSSProperties = {
  display: 'flex',
  gap: 4,
  borderBottom: '1px solid var(--color-border)',
  flexWrap: 'wrap',
}
