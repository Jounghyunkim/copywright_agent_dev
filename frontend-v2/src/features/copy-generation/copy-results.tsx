import { CSSProperties, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import type { CopyDiagnostic, CopyItem, CopyResult, SelectedCopy } from '@/shared/api/types'

import { countryMeta } from './constants'
import { type TranslatedCopy, useTranslateCopy } from './use-translate'

/**
 * ISO 국가코드 → 기본 언어 코드 매핑.
 * 해당 국가의 카피가 이미 사용자 UI 언어와 동일한 언어로 생성됐는지 판정할 때 사용.
 */
const COUNTRY_TO_LANG: Record<string, string> = {
  KR: 'ko',
  US: 'en',
  GB: 'en',
  AU: 'en',
  CA: 'en',
  IN: 'en',
  DE: 'de',
  FR: 'fr',
  IT: 'it',
  ES: 'es',
  MX: 'es',
  BR: 'pt',
  JP: 'ja',
  CN: 'zh',
  ID: 'id',
  TH: 'th',
  SA: 'ar',
  NL: 'nl',
  SE: 'sv',
  PL: 'pl',
}

function baseLang(locale: string): string {
  return (locale || '').toLowerCase().split('-')[0]
}

function countryMatchesLocale(countryCode: string, locale: string): boolean {
  const countryLang = COUNTRY_TO_LANG[countryCode]
  if (!countryLang) return false
  return countryLang === baseLang(locale)
}

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
  const { t, i18n } = useTranslation()
  const currentLocale = i18n.language || 'ko'
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  const { translations, pending, translate } = useTranslateCopy()

  useEffect(() => {
    if (!results?.length) return
    setExpanded(new Set(results.map((r) => r.countryCode)))
  }, [results])

  // 국가 카피 언어가 현재 UI 언어와 다르면 자동 번역 트리거.
  // currentLocale 의존성으로 언어 전환 시 재번역이 호출된다.
  useEffect(() => {
    for (const result of results) {
      if (countryMatchesLocale(result.countryCode, currentLocale)) continue
      result.copies.forEach((copy, idx) => {
        const key = `${result.countryCode}-${idx}`
        translate(key, copy)
      })
    }
  }, [results, translate, currentLocale])

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
          {t('copy-results:heading', { countries: results.length, copies: totalCopies })}
        </h3>
        {!readOnly && selectedKeys.size > 0 && (
          <Badge tone="primary">
            {t('copy-results:selectedCount', { count: selectedKeys.size })}
          </Badge>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {results.map((result, countryIdx) => {
          const meta = countryMeta(result.countryCode)
          const isOpen = expanded.has(result.countryCode)

          return (
            <div key={result.countryCode} style={countryCardStyle}>
              <div
                style={countryHeaderStyle(isOpen)}
                onClick={() => toggleCountry(result.countryCode)}
              >
                <span style={countryCodeBadgeStyle}>{result.countryCode}</span>
                <strong style={{ fontSize: 14, color: 'var(--neutral-900)' }}>
                  {meta.label}
                </strong>
                <Badge tone="primary">{meta.lang}</Badge>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>
                  {t('copy-results:variantCount', { count: result.copies.length })}
                </span>
                <span style={{ color: 'var(--neutral-500)', fontSize: 12 }}>
                  {isOpen ? '▾' : '▸'}
                </span>
              </div>
              {isOpen && (
                <div style={variantGridStyle(result.copies.length)}>
                  {result.copies.map((copy, idx) => {
                    const key = `${result.countryCode}-${idx}`
                    const isSelected = selectedKeys.has(key)
                    const sameAsUi = countryMatchesLocale(result.countryCode, currentLocale)
                    const tr = sameAsUi ? undefined : translations.get(key)
                    const loading = sameAsUi ? false : pending.has(key)
                    const diag = diagnostics?.[countryIdx]?.[idx]
                    return (
                      <div
                        key={idx}
                        style={variantCardStyle(isSelected && !readOnly)}
                      >
                        <div style={variantHeaderStyle}>
                          <span style={variantNoStyle}>
                            {t('copy-results:variant', { index: idx + 1 })}
                          </span>
                          <div style={{ flex: 1 }} />
                          {!readOnly && (
                            <label
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 12,
                                color: 'var(--neutral-700)',
                                cursor: 'pointer',
                                userSelect: 'none',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleSelect(result.countryCode, idx)
                                }
                                aria-label={t('copy-results:selectVariantAria', { index: idx + 1 })}
                              />
                              {t('copy-results:select')}
                            </label>
                          )}
                        </div>
                        <CopyDetail
                          copy={copy}
                          translation={tr}
                          isTranslating={loading}
                          diagnostic={diag}
                          compact
                        />
                      </div>
                    )
                  })}
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
            {t('copy-results:reviewSelected')}
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
  compact = false,
}: {
  copy: CopyItem
  translation?: TranslatedCopy
  isTranslating?: boolean
  diagnostic?: CopyDiagnostic
  compact?: boolean
}) {
  const { t } = useTranslation()
  if (!copy) return null
  const hasWarnings = diagnostic && diagnostic.warnings.length > 0
  return (
    <div
      style={{
        padding: compact ? '12px 14px' : '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 10 : 12,
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
            <Badge tone="warning">{t('copy-results:qualityFilter')}</Badge>
            <span style={{ fontWeight: 600, color: '#92400e' }}>
              {t('copy-results:warningsDetected', { count: diagnostic!.warnings.length })}
            </span>
          </div>
          {diagnostic!.warnings.map((w, i) => (
            <p key={i} style={{ margin: 0, color: '#92400e', lineHeight: 1.5 }}>
              &bull; {w}
            </p>
          ))}
        </div>
      )}
      <Field label={t('copy-results:field.headline')} value={copy.headline} large={!compact} translation={translation?.headline} />
      <Field label={t('copy-results:field.subheadline')} value={copy.subheadline} translation={translation?.subheadline} />
      <Field label={t('copy-results:field.bodyCopy')} value={copy.bodyCopy} multiline translation={translation?.bodyCopy} />
      <Field label={t('copy-results:field.cta')} value={copy.cta} translation={translation?.cta} />
      {isTranslating && (
        <p style={{ fontSize: 12, color: 'var(--neutral-500)', fontStyle: 'italic' }}>
          {t('copy-results:translating')}
        </p>
      )}
      {copy.methodology && (
        <Field label={t('copy-results:field.methodology')} value={copy.methodology} muted />
      )}
      {copy.culturalNotes && (
        <Field label={t('copy-results:field.culturalNotes')} value={copy.culturalNotes} muted />
      )}
      {copy.toneAnalysis && (
        <Field label={t('copy-results:field.toneAnalysis')} value={copy.toneAnalysis} muted />
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

const countryCodeBadgeStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.6,
  color: 'var(--lg-red-700)',
  background: 'var(--lg-red-100)',
  border: '1px solid var(--lg-red-600)',
  padding: '3px 8px',
  borderRadius: 6,
  fontFamily: 'JetBrains Mono, monospace',
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

/**
 * 한 행 최대 3개. 변형 개수가 3개 이하이면 행을 꽉 채우도록 컬럼을 그만큼만 배치.
 * 예: 1개 → 1fr / 2개 → 1fr 1fr / 3개 → 1fr 1fr 1fr / 4개 이상 → 3열 그리드 + 줄바꿈
 */
const variantGridStyle = (count: number): CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, count))}, minmax(0, 1fr))`,
  gap: 12,
  padding: 12,
  borderTop: '1px solid var(--color-border)',
  background: 'var(--neutral-50, #fafafa)',
})

const variantCardStyle = (selected: boolean): CSSProperties => ({
  background: '#fff',
  borderRadius: 10,
  border: `1.5px solid ${selected ? 'var(--lg-red-600)' : 'var(--color-border)'}`,
  boxShadow: selected
    ? '0 4px 12px rgba(165,0,52,0.12)'
    : '0 1px 2px rgba(17,17,17,0.04)',
  overflow: 'hidden',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
})

const variantHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 14px',
  background: 'var(--neutral-100)',
  borderBottom: '1px solid var(--color-border)',
}

const variantNoStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: 'var(--lg-red-700)',
  letterSpacing: 0.3,
  textTransform: 'uppercase',
}
