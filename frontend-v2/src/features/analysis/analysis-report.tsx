import { CSSProperties, ReactNode } from 'react'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import type { AnalysisReport as AnalysisReportT } from '@/shared/api/types'

/**
 * LLM이 반환하는 값이 문자열일 수도, 객체일 수도 있으므로 안전하게 렌더링.
 * - string/number/boolean → 그대로
 * - Array → 콤마 join
 * - Object → key: value 줄바꿈 형태
 * - null/undefined → fallback
 */
function safeText(v: unknown, fallback: ReactNode = ''): ReactNode {
  if (v == null) return fallback
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return String(v)
  }
  if (Array.isArray(v)) {
    return v.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ')
  }
  if (typeof v === 'object') {
    return Object.entries(v as Record<string, unknown>)
      .map(([k, val]) => `${k}: ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`)
      .join('\n')
  }
  return String(v)
}

const SECTION_HELP: Record<string, string> = {
  'Research Summary & AI Direction':
    '캠페인 브리프를 요약하고, AI가 분석한 핵심 과제와 크리에이티브 방향을 제시합니다.\n- Objective: 캠페인의 목표\n- Core Challenge: 해결해야 할 핵심 과제\n- AI Direction: AI가 추천하는 전략 방향',
  'Deep-dive Persona':
    '타겟 고객의 심층 프로필입니다. 이름, 신념, 불만, 구매 동기 등을 통해 카피가 누구에게 말하는지 명확히 합니다.\n감정 트리거 키워드는 카피에서 활용할 수 있는 핵심 어휘입니다.',
  'Brand Fit Score':
    '브랜드와 캠페인의 적합도를 0~100% 점수로 평가합니다.\n- Functional: 기능적 적합성\n- Emotional: 감성적 적합성\n- Cultural: 문화적 적합성',
  'Market Opportunity & Risk':
    '시장 내 기회 요소와 위험 요소를 분석한 결과입니다.\n- Opportunity Gap: 경쟁사가 놓치고 있는 기회 영역\n- Risk: 주의해야 할 위험 키워드나 트렌드',
  'Competitive Keywords':
    '경쟁사가 이미 선점한 키워드 목록입니다. 카피에서 이 단어들을 그대로 사용하면 차별화가 어려우므로, 피하거나 재정의해야 합니다.',
  'Untapped Keywords':
    '아직 어떤 경쟁사도 선점하지 않은 감각적·감성적 키워드 영역입니다. 이 키워드들을 활용하면 독자적인 브랜드 언어를 구축할 수 있습니다.',
  'Category Narrative Shift':
    '해당 카테고리의 기존 이야기 방식(Old Narrative)에서 새로운 이야기 방식(New Narrative)으로의 전환을 보여줍니다.\n카피는 이 새로운 내러티브 위에서 작성되어야 합니다.',
  'Emotional Job To Be Done':
    '고객이 이 제품을 통해 실제로 해결하고 싶은 감정적 과업입니다.\n이 문장이 모든 카피의 출발점이 됩니다. "나는 ___하고 싶다" 형태로 표현됩니다.',
  'Cultural Tension Map':
    '타겟 시장에서 존재하는 문화적 긴장 요소들입니다. 이 긴장을 이해하고 활용하면 공감을 이끌어내는 카피를 작성할 수 있습니다.',
  'Copy Implications & Guardrails':
    '카피 작성 시 반드시 따라야 할 가이드라인입니다.\n- DO: 카피에 포함해야 할 요소\n- DON\'T: 카피에서 피해야 할 요소',
  'Recommended Keywords':
    'AI가 분석 결과를 종합하여 추천하는 카피용 핵심 키워드입니다. 이 단어들을 카피에 자연스럽게 녹여 사용하면 효과적입니다.',
}

interface Props {
  report: AnalysisReportT
  /** 사용자가 승인했을 때 호출 → 다음 step으로 전환 */
  onApprove?: () => void
  /** 사용자가 수정을 요청했을 때 호출 → brief로 되돌림 */
  onModify?: () => void
  /** (?) 클릭 시 제목+설명을 부모에 전달 → 채팅에 표시 */
  onHelpRequest?: (title: string, text: string) => void
  /** 이미 승인된 상태면 HITL 블록을 숨김 */
  isApproved?: boolean
}

/**
 * Market Analyst Report — 10 필드 카드 그리드 (12 column).
 */
export function AnalysisReport({
  report: r,
  onApprove,
  onModify,
  onHelpRequest,
  isApproved = false,
}: Props) {
  const help = (title: string) =>
    onHelpRequest ? () => onHelpRequest(title, SECTION_HELP[title] ?? '') : undefined

  return (
    <Card style={{ padding: '1.2rem' }}>
      <h3
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: 'var(--neutral-900)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <span style={{ color: 'var(--lg-red-600)' }}>▤</span>
        Market Analyst Report
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 16,
        }}
      >
        {/* 1. Research Summary */}
        <SubCard span={12} title="Research Summary & AI Direction" icon="ⓘ" onHelp={help('Research Summary & AI Direction')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={bodyText}>
              <strong>Objective:</strong> {safeText(r.briefSummary.objective)}
            </p>
            <p style={bodyText}>
              <strong>Core Challenge:</strong> {safeText(r.briefSummary.coreChallenge)}
            </p>
            <p style={bodyText}>
              <strong>AI Direction:</strong>{' '}
              <span style={{ color: 'var(--lg-red-600)', fontWeight: 500 }}>
                {safeText(r.briefSummary.aiDirection)}
              </span>
            </p>
            {r.briefSummary.toneRole && (
              <p style={{ ...bodyText, whiteSpace: 'pre-wrap' }}>
                <strong>Tone &amp; Role:</strong> {safeText(r.briefSummary.toneRole)}
              </p>
            )}
          </div>
        </SubCard>

        {/* 2. Persona */}
        <SubCard span={7} title="Deep-dive Persona" icon="👤" onHelp={help('Deep-dive Persona')}>
          <div style={{ display: 'flex', gap: 16 }}>
            <img
              src={
                r.persona.avatar ||
                'https://api.dicebear.com/7.x/personas/svg?seed=default'
              }
              alt="Persona"
              style={{ width: 70, height: 70, borderRadius: 18 }}
            />
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: 'var(--neutral-900)',
                }}
              >
                {safeText(r.persona.name)}
              </p>
              {(r.persona.belief || r.persona.painPoint) && (
                <p style={bodyText}>
                  <strong>Belief:</strong>{' '}
                  {safeText(r.persona.belief ?? r.persona.painPoint)}
                </p>
              )}
              {(r.persona.frustration || r.persona.motivation) && (
                <p style={bodyText}>
                  <strong>Frustration:</strong>{' '}
                  {safeText(r.persona.frustration ?? r.persona.motivation)}
                </p>
              )}
              {r.persona.purchaseTrigger && (
                <p style={bodyText}>
                  <strong>Purchase Trigger:</strong> {safeText(r.persona.purchaseTrigger)}
                </p>
              )}
              {!!r.persona.emotionalTriggerWords?.length && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                    marginTop: 4,
                  }}
                >
                  {r.persona.emotionalTriggerWords.map((w, i) => (
                    <Badge key={i} tone="primary">
                      {safeText(w)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SubCard>

        {/* 3. Brand Fit */}
        <SubCard span={5} title="Brand Fit Score" icon="✓" onHelp={help('Brand Fit Score')}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <p
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: 'var(--lg-red-600)',
                margin: 0,
                lineHeight: 1,
              }}
            >
              {r.brandFit.score}%
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(r.brandFit.functionalFit || r.brandFit.positiveSignals) && (
              <p style={bodyText}>
                <strong>Functional:</strong>{' '}
                {safeText(r.brandFit.functionalFit ?? r.brandFit.positiveSignals)}
              </p>
            )}
            {r.brandFit.emotionalFit && (
              <p style={bodyText}>
                <strong>Emotional:</strong> {safeText(r.brandFit.emotionalFit)}
              </p>
            )}
            {r.brandFit.culturalFit && (
              <p style={bodyText}>
                <strong>Cultural:</strong> {safeText(r.brandFit.culturalFit)}
              </p>
            )}
          </div>
        </SubCard>

        {/* 4. Market Opportunity & Risk */}
        <SubCard span={12} title="Market Opportunity & Risk" icon="📈" onHelp={help('Market Opportunity & Risk')}>
          <p style={{ ...bodyText, marginBottom: 10 }}>
            <strong style={{ color: 'var(--success)' }}>Opportunity Gap:</strong>{' '}
            {safeText(r.marketAnalysis.opportunityGap)}
          </p>
          <p style={bodyText}>
            <strong style={{ color: 'var(--warning)' }}>Risk:</strong>{' '}
            {safeText(r.marketAnalysis.riskKeyword)}
          </p>
        </SubCard>

        {/* 5. Competitive Keywords */}
        <SubCard span={6} title="Competitive Keywords" icon="◈" onHelp={help('Competitive Keywords')}>
          <p style={mutedHint}>
            Language already owned by competitors — avoid or redefine
          </p>
          <div>
            {r.competitiveKeywords.map((kw) => (
              <div
                key={kw.word}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  marginBottom: 10,
                }}
              >
                <span>{safeText(kw.word)}</span>
                <div
                  style={{
                    width: '50%',
                    height: 8,
                    background: 'var(--neutral-200)',
                    borderRadius: 4,
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, kw.count)}%`,
                      height: 8,
                      background: 'var(--neutral-500)',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SubCard>

        {/* 6. Untapped Keywords */}
        <SubCard span={6} title="Untapped Keywords" icon="◎" onHelp={help('Untapped Keywords')}>
          <p style={mutedHint}>Sensory & emotional territory no one owns yet</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(r.marketAnalysis.untappedKeywords ?? []).map((kw, i) => (
              <Badge key={i} tone="primary">
                {safeText(kw)}
              </Badge>
            ))}
          </div>
        </SubCard>

        {/* 7. Category Narrative Shift */}
        {r.categoryNarrative.oldNarrative && (
          <SubCard span={12} title="Category Narrative Shift" icon="↻" onHelp={help('Category Narrative Shift')}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: 16,
                alignItems: 'center',
              }}
            >
              <div style={narrativeBox('var(--neutral-100)')}>
                <p
                  style={{ ...labelText, color: 'var(--neutral-700)' }}
                >
                  Old Narrative
                </p>
                <p style={{ ...bodyText, fontStyle: 'italic' }}>
                  {safeText(r.categoryNarrative.oldNarrative)}
                </p>
              </div>
              <span style={{ fontSize: '1.5rem', color: 'var(--lg-red-600)' }}>
                →
              </span>
              <div style={narrativeBox('var(--lg-red-100)')}>
                <p style={{ ...labelText, color: 'var(--lg-red-700)' }}>
                  New Narrative
                </p>
                <p style={{ ...bodyText, fontWeight: 500 }}>
                  {safeText(r.categoryNarrative.newNarrative)}
                </p>
              </div>
            </div>
          </SubCard>
        )}

        {/* 8. Emotional JTBD */}
        {r.emotionalJTBD && (
          <SubCard span={6} title="Emotional Job To Be Done" icon="♥" onHelp={help('Emotional Job To Be Done')}>
            <div style={blockquote}>"{safeText(r.emotionalJTBD)}"</div>
            <p style={{ ...mutedHint, marginTop: 10 }}>
              This sentence becomes the root of all copy.
            </p>
          </SubCard>
        )}

        {/* 9. Cultural Tension Map */}
        {!!r.culturalTension.tensions?.length && (
          <SubCard span={6} title="Cultural Tension Map" icon="🌐" onHelp={help('Cultural Tension Map')}>
            {r.culturalTension.tensions.map((t, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'var(--lg-red-100)',
                    color: 'var(--lg-red-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ color: 'var(--neutral-700)' }}>{safeText(t)}</span>
              </div>
            ))}
          </SubCard>
        )}

        {/* 10. Copy Implications & Guardrails */}
        {(r.copyImplications.doList || r.copyImplications.dontList) && (
          <SubCard span={12} title="Copy Implications & Guardrails" icon="✎" onHelp={help('Copy Implications & Guardrails')}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
              }}
            >
              <div>
                <p
                  style={{
                    ...labelText,
                    color: 'var(--success)',
                    marginBottom: 8,
                  }}
                >
                  DO
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(r.copyImplications.doList ?? []).map((item, i) => (
                    <Badge key={i} tone="success">
                      {safeText(item)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p
                  style={{
                    ...labelText,
                    color: 'var(--danger)',
                    marginBottom: 8,
                  }}
                >
                  DON&apos;T
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(r.copyImplications.dontList ?? []).map((item, i) => (
                    <Badge key={i} tone="danger">
                      {safeText(item)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </SubCard>
        )}

        {/* 11. Recommended Keywords */}
        {r.recommendedKeywords.length > 0 && (
          <SubCard span={12} title="Recommended Keywords" icon="✦" onHelp={help('Recommended Keywords')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {r.recommendedKeywords.map((kw, i) => (
                <Badge key={i} tone="success">
                  {safeText(kw)}
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
            <Button onClick={onApprove}>③ 전략 메시지 생성</Button>
          </div>
        )}
      </div>
    </Card>
  )
}

/* ── Internal SubCard wrapper ── */

function SubCard({
  span,
  title,
  icon,
  onHelp,
  children,
}: {
  span: number
  title: string
  icon?: string
  onHelp?: () => void
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
        {onHelp && (
          <span
            onClick={onHelp}
            title="클릭하면 AI 어시스턴트가 설명합니다"
            style={helpBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--lg-red-100)'; e.currentTarget.style.color = 'var(--lg-red-600)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--neutral-200)'; e.currentTarget.style.color = 'var(--neutral-600)' }}
          >
            ?
          </span>
        )}
      </h4>
      {children}
    </section>
  )
}

/* ── Inline style atoms ── */

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
  lineHeight: 1.6,
}

const labelText: CSSProperties = {
  fontWeight: 700,
  fontSize: 13,
  color: 'var(--neutral-900)',
  marginBottom: 4,
}

const mutedHint: CSSProperties = {
  margin: '0 0 10px 0',
  fontSize: 12,
  color: 'var(--neutral-500)',
}

const blockquote: CSSProperties = {
  margin: 0,
  padding: '12px 16px',
  borderLeft: '3px solid var(--lg-red-600)',
  background: '#fff8fa',
  borderRadius: '0 10px 10px 0',
  fontSize: 15,
  fontStyle: 'italic',
  lineHeight: 1.7,
  color: 'var(--neutral-900)',
}

const helpBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  borderRadius: '50%',
  background: 'var(--neutral-200)',
  color: 'var(--neutral-600)',
  fontSize: 10,
  fontWeight: 700,
  cursor: 'pointer',
  lineHeight: 1,
  userSelect: 'none',
  marginLeft: 2,
  transition: 'background 0.15s, color 0.15s',
}

const narrativeBox = (bg: string): CSSProperties => ({
  padding: '12px 16px',
  borderRadius: 12,
  background: bg,
  fontSize: 14,
  lineHeight: 1.6,
  color: 'var(--neutral-900)',
})
