import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useUIStore } from '@/shared/state/ui-store'

const typeColors = {
  info: { bg: 'var(--color-info-bg)', border: 'var(--color-info-border)', text: 'var(--color-info-text)' },
  success: { bg: 'var(--color-success-bg)', border: 'var(--color-success-border)', text: 'var(--color-success-text)' },
  error: { bg: 'var(--color-error-bg)', border: 'var(--color-error-border)', text: 'var(--color-error-text)' },
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)
  const removeToast = useUIStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return createPortal(
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 10000,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map((t) => {
        const c = typeColors[t.type]
        return (
          <div key={t.id} style={{
            background: c.bg, border: `1px solid ${c.border}`, color: c.text,
            padding: '10px 16px', borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: 'var(--shadow-lg)', animation: 'slideInRight 0.2s ease',
            maxWidth: 360,
          }}>
            <span style={{ flex: 1 }}>{t.message}</span>
            <X size={14} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => removeToast(t.id)} />
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
