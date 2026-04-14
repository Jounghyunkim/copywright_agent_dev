import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export function Toast({
  open,
  title,
  description,
  variant = 'default',
}: {
  open: boolean
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(t)
    }
    setVisible(false)
  }, [open])

  if (!open) return null

  const isDestructive = variant === 'destructive'

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        maxWidth: 380,
        width: '100%',
        pointerEvents: 'auto',
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
      }}
    >
      <div
        style={{
          background: isDestructive ? '#fef2f2' : 'var(--color-surface, #fff)',
          border: `1px solid ${isDestructive ? '#fca5a5' : 'var(--color-border, #e5e7eb)'}`,
          borderRadius: 10,
          padding: '14px 18px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          display: 'grid',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isDestructive && (
            <span style={{ fontSize: 18, lineHeight: 1 }}>&#9888;</span>
          )}
          <strong style={{
            fontSize: 14,
            color: isDestructive ? '#b91c1c' : 'var(--neutral-900, #111)',
          }}>
            {title}
          </strong>
        </div>
        {description && (
          <p style={{
            fontSize: 13,
            color: isDestructive ? '#991b1b' : 'var(--neutral-700, #555)',
            margin: 0,
            lineHeight: 1.4,
          }}>
            {description}
          </p>
        )}
      </div>
    </div>,
    document.body,
  )
}
