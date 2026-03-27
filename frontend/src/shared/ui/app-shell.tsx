import { useState, useRef, useEffect, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Bot, LayoutDashboard, Plus, List, Settings, PenTool, ListChecks,
  ChevronLeft, ChevronRight, Info,
} from 'lucide-react'
import { useUIStore } from '@/shared/state/ui-store'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/new', label: 'New Campaign', icon: Plus },
  { to: '/workflows', label: 'Campaigns', icon: List },
  { to: '/about', label: 'About', icon: Info },
]

const GEAR_ITEMS = [
  { label: 'Skill Authoring', icon: PenTool, path: '/settings?tab=skill-builder' },
  { label: 'Skill Management', icon: ListChecks, path: '/settings?tab=skill-manager' },
  { label: 'General Settings', icon: Settings, path: '/settings' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const sseConnected = useUIStore((s) => s.sseConnected)
  const [gearOpen, setGearOpen] = useState(false)
  const gearRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (gearRef.current && !gearRef.current.contains(e.target as Node)) setGearOpen(false)
    }
    if (gearOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [gearOpen])

  const sidebarWidth = collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth,
        flexShrink: 0,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          height: 'var(--topbar-height)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: collapsed ? '0 16px' : '0 20px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px var(--color-primary-shadow)',
          }}>
            <Bot size={18} />
          </div>
          {!collapsed && (
            <span style={{ fontWeight: 800, fontSize: '1rem', whiteSpace: 'nowrap' }}>
              Copywrite Agent
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
            return (
              <NavLink key={item.to} to={item.to} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: collapsed ? '10px 16px' : '10px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem', fontWeight: active ? 700 : 500,
                color: active ? 'var(--color-primary)' : 'var(--color-text)',
                background: active ? 'var(--color-primary-bg)' : 'transparent',
                transition: 'all 0.15s',
                textDecoration: 'none',
              }}>
                <Icon size={18} />
                {!collapsed && item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom gear */}
        <div ref={gearRef} style={{
          padding: '12px 8px', borderTop: '1px solid var(--color-border)',
          position: 'relative',
        }}>
          {/* SSE status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', marginBottom: 8,
            fontSize: '0.72rem', color: 'var(--color-text-secondary)',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: sseConnected ? 'var(--color-success)' : 'var(--color-error)',
              boxShadow: `0 0 6px ${sseConnected ? 'var(--color-success)' : 'var(--color-error)'}`,
            }} />
            {!collapsed && (sseConnected ? 'Connected' : 'Disconnected')}
          </div>

          <button
            onClick={() => setGearOpen(!gearOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '10px 16px',
              borderRadius: 'var(--radius-md)', border: 'none', background: 'none',
              cursor: 'pointer', color: gearOpen ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontSize: '0.85rem', fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            <Settings size={18} style={{
              transition: 'transform 0.3s',
              transform: gearOpen ? 'rotate(90deg)' : 'none',
            }} />
            {!collapsed && 'Settings'}
          </button>

          {gearOpen && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 8, right: 8,
              background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)',
              padding: 6, marginBottom: 4, animation: 'fadeIn 0.15s ease',
            }}>
              {GEAR_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink key={item.path} to={item.path} onClick={() => setGearOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem', fontWeight: 600,
                    color: 'var(--color-text)', textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Icon size={16} color="var(--color-primary)" />
                    {item.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button onClick={toggleSidebar} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '8px', border: 'none', background: 'none',
          cursor: 'pointer', color: 'var(--color-text-muted)',
          borderTop: '1px solid var(--color-border)',
        }}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--color-bg)',
      }}>
        {/* Topbar */}
        <header style={{
          height: 'var(--topbar-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            AI Copywriting Platform
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Admin
            </span>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
