/**
 * BriefPreviewPanel — 인라인 탭 기반 프리뷰 (모달 대신 패널에 표시)
 * - Tab 1: Message Matrix (파싱 데이터가 있을 때만)
 * - Tab 2: LG Campaign Research (brief)
 * - 돌아가기 버튼으로 브리프 폼으로 복귀
 */

import { CSSProperties, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import type {
  CampaignBrief,
  MessageMatrixProduct,
} from '@/shared/api/types'

interface Props {
  brief: CampaignBrief
  matrixData: Record<string, MessageMatrixProduct> | null
  onBack: () => void
}

type TabId = 'matrix' | 'research'

export function BriefPreviewPanel({ brief, matrixData, onBack }: Props) {
  const { t } = useTranslation()
  const hasMatrix = !!matrixData && Object.keys(matrixData).length > 0
  const tabs: { id: TabId; label: string }[] = [
    ...(hasMatrix ? [{ id: 'matrix' as const, label: 'Message Matrix' }] : []),
    { id: 'research' as const, label: 'LG Campaign Research' },
  ]
  const [activeTab, setActiveTab] = useState<TabId>(tabs[0].id)

  return (
    <Card style={{ padding: '1.2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--neutral-900)' }}>
          Research Preview
        </h3>
        <Button variant="ghost" className="btn-compact" onClick={onBack}>
          {t('brief:form.button.back')}
        </Button>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)', marginBottom: 16 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={tabStyle(activeTab === tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div>
        {activeTab === 'matrix' && hasMatrix && (
          <MatrixPreviewContent matrixData={matrixData!} />
        )}
        {activeTab === 'research' && <BriefPreview brief={brief} />}
      </div>
    </Card>
  )
}

/* ── Tab style ── */

const tabStyle = (active: boolean): CSSProperties => ({
  padding: '10px 20px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  borderBottom: active ? '3px solid var(--lg-red-600)' : '3px solid transparent',
  background: 'none',
  color: active ? 'var(--lg-red-600)' : 'var(--neutral-500)',
  transition: 'all 0.15s',
})

/* ── Message Matrix 탭 ── */

function MatrixPreviewContent({ matrixData }: { matrixData: Record<string, MessageMatrixProduct> }) {
  const sheetNames = Object.keys(matrixData)

  return (
    <div>
      {sheetNames.map((sheetName) => {
        const product = matrixData[sheetName]
        return (
          <div key={sheetName} style={{ marginBottom: 32 }}>
            {/* Sheet header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
              paddingBottom: 10, borderBottom: '2px solid var(--lg-red-600)',
            }}>
              <span style={{ fontSize: 16 }}>📦</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--neutral-900)' }}>{sheetName}</span>
            </div>

            {/* Product info table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
              <tbody>
                {([
                  ['Product Name', `${product.product_name}${product.sub_name ? ' ' + product.sub_name : ''}`],
                  ['Head Message', product.head_message],
                  ['Description', product.description],
                ] as [string, string][]).map(([label, value]) => (
                  <tr key={label}>
                    <td style={infoCellLabel}>{label}</td>
                    <td style={infoCellValue}>{value || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Categories */}
            {product.categories?.map((cat, catIdx) => (
              <div key={catIdx} style={{ marginBottom: 20 }}>
                <div style={catHeader}>
                  <Badge tone="primary">Category {cat.number}</Badge>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-900)' }}>
                    {cat.name}
                  </span>
                </div>

                {cat.key_message && (
                  <p style={{ fontSize: 12, color: 'var(--neutral-500)', fontStyle: 'italic', padding: '4px 10px', margin: '0 0 8px 0' }}>
                    {cat.key_message}
                  </p>
                )}

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        {['USP #', 'Feature Name', 'Key Message (Full)', 'Key Message (Short)', 'Benefit Description'].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cat.usps?.map((usp, ui) => (
                        <tr key={ui} style={{ background: ui % 2 === 0 ? 'var(--white)' : 'var(--neutral-100)' }}>
                          <td style={tdStyle}><span style={{ fontWeight: 600, color: 'var(--lg-red-600)' }}>{usp.usp_no}</span></td>
                          <td style={tdStyle}>{usp.feature_name}</td>
                          <td style={tdStyle}>{usp.key_message_full}</td>
                          <td style={tdStyle}>{usp.key_message_short}</td>
                          <td style={tdStyle}>{usp.benefit_description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {cat.usps?.some((u) => u.rtb) && (
                  <div style={rtbBox}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>RTB (Reason to Believe)</div>
                    {cat.usps.filter((u) => u.rtb).map((usp, ri) => (
                      <div key={ri} style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{usp.feature_name}: </span>
                        <span style={{ fontSize: 12, color: 'var(--neutral-500)', whiteSpace: 'pre-wrap' }}>{usp.rtb}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

/* ── Campaign Research 탭 ── */

function BriefPreview({ brief: b }: { brief: CampaignBrief }) {
  const { t } = useTranslation()
  const notWritten = t('brief:form.notWritten')
  const Val = ({ v }: { v: string }) =>
    v ? <p style={s.body}>{v}</p> : <p style={s.empty}>{notWritten}</p>

  return (
    <div>
      <p style={s.h1}>
        {b.projectName || 'Untitled Project'}
        <Badge tone="primary" style={{ marginLeft: 8, fontSize: '0.72rem' }}>BRIEF</Badge>
      </p>
      <p style={s.meta}>{t('brief:form.createdDate', { date: b.date.replace(/-/g, '.') })}</p>

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

/* ── Styles ── */

const infoCellLabel: CSSProperties = {
  padding: '8px 12px', fontWeight: 600, fontSize: 13,
  color: 'var(--neutral-500)', width: 150, verticalAlign: 'top',
  borderBottom: '1px solid var(--color-border)', background: 'var(--neutral-100)',
}

const infoCellValue: CSSProperties = {
  padding: '8px 12px', fontSize: 13, color: 'var(--neutral-900)',
  borderBottom: '1px solid var(--color-border)',
}

const catHeader: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  marginBottom: 8, padding: '6px 10px',
  background: 'var(--neutral-100)', borderRadius: 6, border: '1px solid var(--color-border)',
}

const thStyle: CSSProperties = {
  padding: '8px 10px', fontWeight: 600, fontSize: 11,
  color: 'var(--neutral-500)', textAlign: 'left',
  borderBottom: '2px solid var(--color-border)', background: 'var(--neutral-100)',
}

const tdStyle: CSSProperties = {
  padding: '6px 10px', borderBottom: '1px solid var(--color-border)',
}

const rtbBox: CSSProperties = {
  marginTop: 10, padding: '10px 12px',
  background: '#fffbeb', borderRadius: 6, border: '1px solid #fde68a',
}

const s: Record<string, CSSProperties> = {
  h1: {
    fontSize: '1.4rem', fontWeight: 800,
    color: 'var(--neutral-900)', margin: '0 0 4px 0',
    letterSpacing: '-0.3px', display: 'flex', alignItems: 'center',
  },
  h2: {
    fontSize: '1rem', fontWeight: 700,
    color: 'var(--lg-red-700)', margin: '20px 0 8px 0',
    paddingBottom: 6, borderBottom: '2px solid var(--lg-red-700)',
  },
  h3: {
    fontSize: '0.88rem', fontWeight: 700,
    color: 'var(--neutral-700)', margin: '12px 0 4px 0',
  },
  meta: {
    fontSize: '0.82rem', color: 'var(--neutral-500)', margin: '0 0 2px 0',
  },
  body: {
    fontSize: '0.88rem', color: 'var(--neutral-700)',
    lineHeight: 1.7, margin: '4px 0 0 0', whiteSpace: 'pre-wrap',
  },
  empty: {
    fontSize: '0.85rem', color: 'var(--neutral-500)',
    fontStyle: 'italic', margin: '4px 0 0 0',
  },
}
