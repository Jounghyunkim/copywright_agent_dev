import { CSSProperties, ReactNode } from 'react'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import type { StrategicMessageData } from '@/shared/api/types'

/** LLM 응답이 string/object/array 어느 형태든 안전하게 텍스트로 변환. */
function safeText(v: unknown, fallback: ReactNode = ''): ReactNode {
  if (v == null) return fallback
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
    return String(v)
  if (Array.isArray(v))
    return v
      .map((item) =>
        typeof item === 'object' ? JSON.stringify(item) : String(item),
      )
      .join(', ')
  if (typeof v === 'object')
    return Object.entries(v as Record<string, unknown>)
      .map(([k, val]) =>
        `${k}: ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`,
      )
      .join('\n')
  return String(v)
}

interface Props {
  data: StrategicMessageData
  onApprove?: () => void
  onModify?: () => void
  isApproved?: boolean
}

/**
 * Copywriting Strategy — Core Message + Message Pillars + Emotional Hook +
 * Tone Direction + Key Phrases 를 카드 그리드로 표시.
 */
export function StrategicMessageView({
  data,
  onApprove,
  onModify,
  isApproved = false,
}: Props) {
  return (
    <Card style={{ padding: '1.2rem' }}>
      <h3
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: 'var(--neutral-900)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ color: 'var(--lg-red-600)' }}>✦</span>
        Copywriting Strategy
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 16,
        }}
      >
        {/* Core Message */}
        <SubCard span={12} title="Core Message" icon="◎">
          <div style={blockquote}>"{safeText(data.coreMessage)}"</div>
        </SubCard>

        {/* Message Pillars */}
        {!!data.messagePillars?.length && (
          <SubCard span={12} title="Message Pillars" icon="▤">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(
                  3,
                  data.messagePillars.length,
                )}, 1fr)`,
                gap: 12,
              }}
            >
              {data.messagePillars.map((p, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 14px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    background: 'var(--neutral-100)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--lg-red-700)',
                      marginBottom: 6,
                    }}
                  >
                    {safeText(p.title)}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--neutral-700)',
                      lineHeight: 1.6,
                    }}
                  >
                    {safeText(p.description)}
                  </p>
                </div>
              ))}
            </div>
          </SubCard>
        )}

        {/* Emotional Hook */}
        {data.emotionalHook && (
          <SubCard span={6} title="Emotional Hook" icon="♥">
            <p style={{ ...bodyText, whiteSpace: 'pre-wrap' }}>{safeText(data.emotionalHook)}</p>
          </SubCard>
        )}

        {/* Tone Direction */}
        {data.toneDirection && (
          <SubCard span={6} title="Tone Direction" icon="♪">
            <p style={{ ...bodyText, whiteSpace: 'pre-wrap' }}>{safeText(data.toneDirection)}</p>
          </SubCard>
        )}

        {/* Key Phrases */}
        {!!data.keyPhrases?.length && (
          <SubCard span={12} title="Key Phrases" icon="✎">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {data.keyPhrases.map((kp, i) => (
                <Badge key={i} tone="primary">
                  {safeText(kp)}
                </Badge>
              ))}
            </div>
          </SubCard>
        )}

        {/* HITL — '이전 단계'는 외부(editor-page)에서 공통 스타일로 렌더 */}
        {!isApproved && onApprove && (
          <div
            style={{
              gridColumn: 'span 12',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              paddingTop: 12,
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <Button onClick={onApprove}>④ 카피 후보 생성</Button>
          </div>
        )}
      </div>
    </Card>
  )
}

function SubCard({
  span,
  title,
  icon,
  children,
}: {
  span: number
  title: string
  icon?: string
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        gridColumn: `span ${span}`,
        background: 'var(--white)',
        borderRadius: 14,
        padding: '1.2rem',
        border: '1px solid var(--color-border)',
        boxShadow: '0 4px 12px rgba(17, 17, 17, 0.04)',
      }}
    >
      <h4 style={titleText}>
        {icon && (
          <span style={{ color: 'var(--lg-red-600)', fontSize: 14 }}>
            {icon}
          </span>
        )}
        {title}
      </h4>
      {children}
    </section>
  )
}

const titleText: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--neutral-700)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 12,
}

const bodyText: CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: 'var(--neutral-700)',
  lineHeight: 1.7,
}

const blockquote: CSSProperties = {
  margin: 0,
  padding: '12px 16px',
  borderLeft: '3px solid var(--lg-red-600)',
  background: '#fff8fa',
  borderRadius: '0 10px 10px 0',
  fontSize: 16,
  fontStyle: 'italic',
  lineHeight: 1.7,
  color: 'var(--neutral-900)',
}
