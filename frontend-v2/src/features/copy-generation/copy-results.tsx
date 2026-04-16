import { CSSProperties, useEffect, useMemo, useState } from 'react'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import type { CopyDiagnostic, CopyItem, CopyResult, SelectedCopy } from '@/shared/api/types'

import { countryMeta } from './constants'
import { type TranslatedCopy, useTranslateCopy } from './use-translate'

interface Props {
  /** 서버가 반환한 국가별 카피 결과 */
  results: CopyResult[]
  /** 후처리 필터 진단 결과 (optional, writer 페르소나 사용 시) */
  diagnostics?: CopyDiagnostic[][] | null
  /** 리뷰로 진행. 선택된 카피 목록을 전달. */
  onProceed?: (selected: SelectedCopy[]) => void
  /** 읽기 전용 모드. 선택 체크박스와 진행 버튼을 숨김. */
  readOnly?: boolean
}

export function CopyResults({ results, diagnostics, onProceed, readOnly = false }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<Record<string, number>>({})
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  const { translations, pending, translate } = useTranslateCopy()

  useEffect(() => {
    if (!results?.length) return
    setExpanded(new Set(results.map((r) => r.countryCode)))
    const next: Record<string, number> = {}
    results.forEach((r) => {
      next[r.countryCode] = 0
    })
    setActiveTab(next)
  }, [results])

  // 비한국어 카피에 대해 자동 번역 트리거
  useEffect(() => {
    for (const result of results) {
      if (result.countryCode === 'KR') continue
      result.copies.forEach((copy, idx) => {
        const key = `${result.countryCode}-${idx}`
        translate(key, copy)
      })
    }
  }, [results, translate])

  const toggleCountry = (code: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const toggleSelect = (code: string, idx: number) => {
    const key = `${code}-${idx}`
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleProceed = () => {
    if (!onProceed) return
    const selected: SelectedCopy[] = []
    for (const result of results) {
      result.copies.forEach((copy, idx) => {
        const key = `${result.countryCode}-${idx}`
        if (selectedKeys.has(key)) {
          selected.push({
            key,
            countryCode: result.countryCode,
            copyData: copy,
          })
        }
      })
    }
    onProceed(selected)
  }

  const totalCopies = useMemo(
    () => results.reduce((sum, r) => sum + (r.copies?.length ?? 0), 0),
    [results],
  )

  return (
    <Card style={{ padding: '1.2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: 'var(--neutral-900)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ color: 'var(--lg-red-600)' }}>✎</span>
          Copy Results ({results.length}개 국가 · {totalCopies}개 카피)
        </h3>
        {!readOnly && selectedKeys.size > 0 && (
          <Badge tone="primary">선택 {selectedKeys.size}개</Badge>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {results.map((result, countryIdx) => {
          const meta = countryMeta(result.countryCode)
          const isOpen = expanded.has(result.countryCode)
          const tab = activeTab[result.countryCode] ?? 0
          const activeCopy = result.copies[tab]
          const activeDiag = diagnostics?.[countryIdx]?.[tab]
          const copyKey = `${result.countryCode}-${tab}`
          const isKorean = result.countryCode === 'KR'
          const translated = isKorean ? undefined : translations.get(copyKey)
          const isTranslating = isKorean ? false : pending.has(copyKey)

          return (
            <div key={result.countryCode} style={countryCardStyle}>
              <div
                style={countryHeaderStyle(isOpen)}
                onClick={() => toggleCountry(result.countryCode)}
              >
                <span style={{ fontSize: 22 }}>{meta.flag}</span>
                <strong style={{ fontSize: 14, color: 'var(--neutral-900)' }}>
                  {meta.label}
                </strong>
                <Badge tone="primary">{meta.lang}</Badge>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>
                  {result.copies.length}개 변형
                </span>
                <span style={{ color: 'var(--neutral-500)', fontSize: 12 }}>
                  {isOpen ? '▾' : '▸'}
                </span>
              </div>
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div style={tabBarStyle}>
                    {result.copies.map((_, idx) => {
                      const key = `${result.countryCode}-${idx}`
                      const isActive = tab === idx
                      const isSelected = selectedKeys.has(key)
                      return (
                        <div
                          key={idx}
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <button
                            type="button"
                            style={tabBtnStyle(isActive)}
                            onClick={() =>
                              setActiveTab((prev) => ({
                                ...prev,
                                [result.countryCode]: idx,
                              }))
                            }
                          >
                            변형 {idx + 1}
                          </button>
                          {!readOnly && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleSelect(result.countryCode, idx)
                              }
                              aria-label={`변형 ${idx + 1} 선택`}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <CopyDetail
                    copy={activeCopy}
                    translation={translated}
                    isTranslating={isTranslating}
                    diagnostic={activeDiag}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!readOnly && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            paddingTop: 12,
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <Button
            onClick={handleProceed}
            disabled={selectedKeys.size === 0}
          >
            ⑤ 선택 카피 검토
          </Button>
        </div>
      )}
    </Card>
  )
}

function CopyDetail({
  copy,
  translation,
  isTranslating,
  diagnostic,
}: {
  copy: CopyItem
  translation?: TranslatedCopy
  isTranslating?: boolean
  diagnostic?: CopyDiagnostic
}) {
  if (!copy) return null
  const hasWarnings = diagnostic && diagnostic.warnings.length > 0
  return (
    <div
      style={{
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {hasWarnings && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '10px 14px',
            background: '#fffbeb',
            border: '1px solid #fbbf24',
            borderRadius: 10,
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Badge tone="warning">Quality Filter</Badge>
            <span style={{ fontWeight: 600, color: '#92400e' }}>
              {diagnostic!.warnings.length}건 감지
            </span>
          </div>
          {diagnostic!.warnings.map((w, i) => (
            <p key={i} style={{ margin: 0, color: '#92400e', lineHeight: 1.5 }}>
              &bull; {w}
            </p>
          ))}
        </div>
      )}
      <Field label="Headline" value={copy.headline} large translation={translation?.headline} />
      <Field label="Subheadline" value={copy.subheadline} translation={translation?.subheadline} />
      <Field label="Body Copy" value={copy.bodyCopy} multiline translation={translation?.bodyCopy} />
      <Field label="CTA" value={copy.cta} translation={translation?.cta} />
      {isTranslating && (
        <p style={{ fontSize: 12, color: 'var(--neutral-500)', fontStyle: 'italic' }}>
          한국어 번역 중…
        </p>
      )}
      {copy.methodology && (
        <Field label="Methodology" value={copy.methodology} muted />
      )}
      {copy.culturalNotes && (
        <Field label="Cultural Notes" value={copy.culturalNotes} muted />
      )}
      {copy.toneAnalysis && (
        <Field label="Tone Analysis" value={copy.toneAnalysis} muted />
      )}
    </div>
  )
}

function Field({
  label,
  value,
  large,
  multiline,
  muted,
  translation,
}: {
  label: string
  value: string
  large?: boolean
  multiline?: boolean
  muted?: boolean
  translation?: string
}) {
  if (!value) return null
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--neutral-500)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: large ? 18 : 14,
          fontWeight: large ? 700 : 500,
          color: muted ? 'var(--neutral-500)' : 'var(--neutral-900)',
          lineHeight: 1.6,
          whiteSpace: multiline ? 'pre-wrap' : undefined,
        }}
      >
        {value}
      </p>
      {translation && (
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: large ? 14 : 13,
            color: 'var(--neutral-500)',
            lineHeight: 1.5,
            whiteSpace: multiline ? 'pre-wrap' : undefined,
            paddingLeft: 10,
            borderLeft: '2px solid var(--neutral-200)',
          }}
        >
          {translation}
        </p>
      )}
    </div>
  )
}

/* ── Styles ── */

const countryCardStyle: CSSProperties = {
  background: 'var(--white)',
  borderRadius: 14,
  border: '1px solid var(--color-border)',
  boxShadow: '0 4px 12px rgba(17, 17, 17, 0.04)',
  overflow: 'hidden',
}

const countryHeaderStyle = (isOpen: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 16px',
  cursor: 'pointer',
  userSelect: 'none',
  background: isOpen ? 'var(--neutral-100)' : 'var(--white)',
  transition: 'background-color 0.15s ease',
})

const tabBarStyle: CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
  alignItems: 'center',
  padding: '10px 16px 6px',
  borderBottom: '1px solid var(--color-border)',
}

const tabBtnStyle = (active: boolean): CSSProperties => ({
  padding: '6px 14px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'inherit',
  background: active ? 'var(--lg-red-600)' : 'transparent',
  color: active ? 'var(--white)' : 'var(--neutral-700)',
  transition: 'all 0.15s ease',
})
