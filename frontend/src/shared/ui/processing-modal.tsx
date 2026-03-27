import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiClient } from '@/shared/api/client'

type TimelineEvent = { event_type: string; payload: Record<string, unknown> }

const EVENT_LABELS: Record<string, string> = {
  QUERY_PLAN: 'Search query planning...',
  WEB_SEARCH: 'Searching the web...',
  RAG_SEARCH: 'Searching knowledge base...',
  SYNTHESIS: 'Synthesizing report...',
  STRATEGIC_MESSAGE: 'Extracting strategic message...',
  COPY_GENERATION: 'Generating copies...',
  REVIEW: 'Reviewing copies...',
}

function buildLabel(ev: TimelineEvent): string {
  return EVENT_LABELS[ev.event_type] ?? ''
}

export function ProcessingModal({ open, title, description, caseId }: {
  open: boolean; title: string; description?: string; caseId?: string
}) {
  const [status, setStatus] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!open || !caseId) { setStatus(''); return }
    const poll = async () => {
      try {
        const res = await apiClient.get<{ items: TimelineEvent[] }>(`/cases/${caseId}/timeline`)
        for (let i = (res.items ?? []).length - 1; i >= 0; i--) {
          const label = buildLabel(res.items[i])
          if (label) { setStatus(label); return }
        }
      } catch { /* ignore */ }
    }
    void poll()
    intervalRef.current = setInterval(poll, 1500)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [open, caseId])

  if (!open) return null

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
        padding: '32px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        boxShadow: 'var(--shadow-xl)', maxWidth: 400, textAlign: 'center',
      }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid var(--color-border)', borderTopColor: 'var(--color-primary)',
          borderRadius: '50%', animation: 'modal-spin 0.8s linear infinite',
        }} />
        <strong style={{ fontSize: '1rem' }}>{title}</strong>
        {status && (
          <div style={{
            fontSize: '0.82rem', fontWeight: 600, padding: '6px 12px',
            background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-sm)',
            color: 'var(--color-primary)',
          }}>
            {status}
          </div>
        )}
        {description && <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{description}</p>}
      </div>
    </div>,
    document.body,
  )
}
