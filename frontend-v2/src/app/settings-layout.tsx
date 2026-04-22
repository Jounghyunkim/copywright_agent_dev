import { CSSProperties } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAuthStore } from '@/shared/state/auth-store'

interface TabDef {
  to: string
  i18nKey: string
  adminOnly?: boolean
}

const TABS: TabDef[] = [
  { to: '/settings', i18nKey: 'settings:tab.general' },
  { to: '/admin/users', i18nKey: 'settings:tab.admin', adminOnly: true },
  { to: '/admin/stats', i18nKey: 'settings:tab.stats', adminOnly: true },
  { to: '/admin/knowledge', i18nKey: 'settings:tab.knowledge', adminOnly: true },
]

/**
 * 설정 섹션 공통 레이아웃.
 * 좌측 기어 메뉴에서 들어온 4개 설정 페이지 상단에 탭 네비를 렌더한다.
 */
export function SettingsLayout() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = !!user?.roles?.includes('admin')
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin)
  const { t } = useTranslation()

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}
    >
      <nav aria-label={t('settings:section')} style={navStyle}>
        {visibleTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              `settings-tab${isActive ? ' active' : ''}`
            }
          >
            {t(tab.i18nKey)}
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
