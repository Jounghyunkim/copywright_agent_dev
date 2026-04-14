import { CSSProperties, useState } from 'react'

import { Modal } from '@/shared/ui/modal'
import { Button } from '@/shared/ui/button'
import type { CampaignBrief } from '@/shared/api/types'

import { briefToMarkdown } from './sections'

export function PreviewModal({
  open,
  brief,
  onClose,
}: {
  open: boolean
  brief: CampaignBrief
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(briefToMarkdown(brief))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="브리프 미리보기" width={720}>
      <div
        style={{
          maxHeight: '60vh',
          overflowY: 'auto',
          padding: '4px 0 8px 0',
        }}
      >
        <Preview brief={brief} />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          paddingTop: 12,
          borderTop: '1px solid var(--color-border)',
          marginTop: 8,
        }}
      >
        <Button variant="ghost" onClick={handleCopy} type="button">
          {copied ? '✓ 복사됨' : 'Markdown 복사'}
        </Button>
        <Button onClick={onClose} type="button">
          닫기
        </Button>
      </div>
    </Modal>
  )
}

/* ── Preview body (simple markdown-like layout) ── */

function Preview({ brief: b }: { brief: CampaignBrief }) {
  const Val = ({ v }: { v: string }) =>
    v ? (
      <p style={s.body}>{v}</p>
    ) : (
      <p style={s.empty}>미작성</p>
    )

  return (
    <div>
      <p style={s.h1}>
        {b.projectName || 'Untitled Project'}
        <span style={s.badge}>BRIEF</span>
      </p>
      <p style={s.meta}>생성일: {b.date.replace(/-/g, '.')}</p>

      <p style={s.h2}>1. Project Context</p>
      <Val v={b.projectContext} />

      <p style={s.h2}>2. Objective</p>
      <p style={s.h3}>Commercial</p>
      <Val v={b.objectiveCommercial} />
      <p style={s.h3}>Behavior</p>
      <Val v={b.objectiveBehavior} />
      <p style={s.h3}>Attitudinal</p>
      <Val v={b.objectiveAttitudinal} />

      <p style={s.h2}>3. Audience</p>
      <Val v={b.audience} />

      <p style={s.h2}>4. Key Message</p>
      <Val v={b.keyMessage} />

      <p style={s.h2}>5. Proof Points</p>
      <Val v={b.proofPoints} />

      <p style={s.h2}>6. Mandatories</p>
      <Val v={b.mandatories} />

      <p style={s.h2}>7. Budget</p>
      <Val v={b.budget} />

      <p style={s.h2}>8. Market Needs</p>
      <Val v={b.marketNeeds} />

      <p style={s.h2}>9. Timing</p>
      <Val v={b.timing} />
    </div>
  )
}

const s: Record<string, CSSProperties> = {
  h1: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: 'var(--neutral-900)',
    margin: '0 0 4px 0',
    letterSpacing: '-0.3px',
  },
  h2: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--lg-red-700)',
    margin: '20px 0 8px 0',
    paddingBottom: 6,
    borderBottom: '2px solid var(--lg-red-700)',
  },
  h3: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: 'var(--neutral-700)',
    margin: '12px 0 4px 0',
  },
  meta: {
    fontSize: '0.82rem',
    color: 'var(--neutral-500)',
    margin: '0 0 2px 0',
  },
  body: {
    fontSize: '0.88rem',
    color: 'var(--neutral-700)',
    lineHeight: 1.7,
    margin: '4px 0 0 0',
    whiteSpace: 'pre-wrap',
  },
  empty: {
    fontSize: '0.85rem',
    color: 'var(--neutral-500)',
    fontStyle: 'italic',
    margin: '4px 0 0 0',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 6,
    background: 'var(--lg-red-100)',
    color: 'var(--lg-red-700)',
    fontSize: '0.72rem',
    fontWeight: 700,
    marginLeft: 8,
  },
}
