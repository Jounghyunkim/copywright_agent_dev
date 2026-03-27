import type { CSSProperties, ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'

const variantMap: Record<BadgeVariant, CSSProperties> = {
  default: { background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' },
  success: { background: 'var(--color-success-bg)', color: 'var(--color-success-text)' },
  warning: { background: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' },
  error: { background: 'var(--color-error-bg)', color: 'var(--color-error-text)' },
  info: { background: 'var(--color-info-bg)', color: 'var(--color-info-text)' },
  purple: { background: '#F3E8FF', color: '#7C3AED' },
}

export function Badge({ variant = 'default', children, style }: {
  variant?: BadgeVariant; children: ReactNode; style?: CSSProperties
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      ...variantMap[variant],
      ...style,
    }}>
      {children}
    </span>
  )
}
