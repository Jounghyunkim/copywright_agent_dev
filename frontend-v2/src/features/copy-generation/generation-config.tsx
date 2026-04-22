import { CSSProperties, useMemo, useState } from 'react'
import Markdown from 'react-markdown'
import { useTranslation } from 'react-i18next'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import type { AIPersona, GenerationConfig as GenerationConfigT } from '@/shared/api/types'
import { usePersonas } from '@/shared/api/hooks'
import { useWorkflowStore } from '@/shared/state/workflow-store'

import { AGE_GROUPS, COUNTRIES, TARGET_PERSONAS } from './constants'
import { inferFromAudience } from './infer-audience'

interface Props {
  onSubmit: (cfg: GenerationConfigT) => void
  isGenerating?: boolean
}

/**
 * 카피 생성 조건 입력 폼.
 * - Target Countries (20개 국가 중 다중 선택)
 * - Target Age Groups (18-24 ~ 55+)
 * - Target Personas (5종)
 * - 카피 변형 수 (1-10)
 */
export function GenerationConfig({
  onSubmit,
  isGenerating = false,
}: Props) {
  const { t } = useTranslation()
  const audience = useWorkflowStore((s) => s.brief.audience)
  const inferred = useMemo(() => inferFromAudience(audience), [audience])

  const [countries, setCountries] = useState<string[]>([])
  const [ages, setAges] = useState<string[]>(inferred.ageGroups)
  const [personas, setPersonas] = useState<string[]>(inferred.personas)
  const [writerPersona, setWriterPersona] = useState<string | undefined>()
  const [copyCount, setCopyCount] = useState(3)

  // AI Writer 페르소나 목록 (선택 사항)
  const personasQuery = usePersonas()
  const writerPersonas: AIPersona[] = (personasQuery.data as any)?.data ?? []

  const toggle = (
    list: string[],
    setList: (v: string[]) => void,
    id: string,
  ) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  const toggleAllCountries = () => {
    setCountries(
      countries.length === COUNTRIES.length ? [] : COUNTRIES.map((c) => c.code),
    )
  }

  const canSubmit =
    countries.length > 0 &&
    ages.length > 0 &&
    personas.length > 0 &&
    !isGenerating

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      countries,
      ageGroups: ages,
      personas,
      skillsets: [],
      copyCount,
      writerPersona,
    })
  }

  return (
    <Card className="stack" style={{ padding: '1.2rem' }}>
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
          {t('generation:heading')}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--neutral-700)' }}>
          {t('generation:instruction')}
        </p>
      </div>

      {/* Countries */}
      <SectionTitle title={t('generation:section.targetCountries')}>
        <button type="button" style={linkBtn} onClick={toggleAllCountries}>
          {countries.length === COUNTRIES.length
            ? t('generation:button.deselectAll')
            : t('generation:button.selectAll')}
        </button>
      </SectionTitle>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}
      >
        {COUNTRIES.map((c) => (
          <CheckboxRow
            key={c.code}
            checked={countries.includes(c.code)}
            onClick={() => toggle(countries, setCountries, c.code)}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 0.5,
                color: 'var(--neutral-700)',
                background: 'var(--neutral-100)',
                border: '1px solid var(--color-border)',
                padding: '2px 6px',
                borderRadius: 5,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {c.code}
            </span>
            <span>{c.label}</span>
          </CheckboxRow>
        ))}
      </div>

      {/* Age Groups */}
      <SectionTitle title={t('generation:section.targetAgeGroups')}>
        {inferred.ageGroups.length > 0 && (
          <Badge tone="primary">{t('generation:autoSelect')}</Badge>
        )}
      </SectionTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {AGE_GROUPS.map((a) => (
          <CheckboxRow
            key={a.id}
            checked={ages.includes(a.id)}
            onClick={() => toggle(ages, setAges, a.id)}
          >
            <span>{a.label}</span>
          </CheckboxRow>
        ))}
      </div>

      {/* Personas */}
      <SectionTitle title={t('generation:section.targetPersonas')}>
        {inferred.personas.length > 0 && (
          <Badge tone="primary">{t('generation:autoSelect')}</Badge>
        )}
      </SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TARGET_PERSONAS.map((p) => (
          <div
            key={p.id}
            onClick={() => toggle(personas, setPersonas, p.id)}
            style={personaCard(personas.includes(p.id))}
          >
            <CheckMark checked={personas.includes(p.id)} />
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: personas.includes(p.id)
                    ? 'var(--lg-red-700)'
                    : 'var(--neutral-900)',
                  margin: 0,
                }}
              >
                {t(`generation:persona.${p.i18nKey}.label`, { defaultValue: p.label })}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--neutral-500)',
                  margin: '2px 0 0 0',
                }}
              >
                {t(`generation:persona.${p.i18nKey}.desc`, { defaultValue: p.desc })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Writer Persona (optional) */}
      {writerPersonas.length > 0 && (
        <>
          <SectionTitle title={t('generation:section.writerPersona')}>
            {writerPersona && (
              <button
                type="button"
                style={linkBtn}
                onClick={() => setWriterPersona(undefined)}
              >
                {t('generation:button.deselect')}
              </button>
            )}
          </SectionTitle>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 8,
            }}
          >
            {writerPersonas.map((p) => {
              const selected = writerPersona === p.id
              return (
                <div
                  key={p.id}
                  onClick={() =>
                    setWriterPersona(selected ? undefined : p.id)
                  }
                  style={writerPersonaCard(selected)}
                >
                  <CheckMark checked={selected} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: selected
                          ? 'var(--lg-red-700)'
                          : 'var(--neutral-900)',
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      {p.name}
                    </p>
                    {p.tags?.length ? (
                      <p
                        style={{
                          fontSize: 12,
                          color: 'var(--neutral-500)',
                          margin: '2px 0 0 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.tags.join(' · ')}
                      </p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
          {(() => {
            const selected = writerPersonas.find((p) => p.id === writerPersona)
            return selected ? <WriterIntroCard persona={selected} /> : null
          })()}
        </>
      )}

      {/* Submit row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--neutral-900)',
            whiteSpace: 'nowrap',
          }}
        >
          {t('generation:variantCount')}
        </label>
        <input
          type="number"
          min={1}
          max={10}
          value={copyCount}
          onChange={(e) => {
            const v = Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
            setCopyCount(v)
          }}
          style={{
            width: 60,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            fontSize: 14,
            fontWeight: 600,
            textAlign: 'center',
            outline: 'none',
          }}
        />
        <div style={{ flex: 1 }} />
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {isGenerating ? t('generation:button.generating') : t('generation:button.generate')}
        </Button>
      </div>

      {!canSubmit && !isGenerating && (
        <p
          style={{
            fontSize: 12,
            color: '#b45309',
            textAlign: 'right',
            margin: 0,
          }}
        >
          {t('generation:validation')}
        </p>
      )}
    </Card>
  )
}

/* ── Internal ── */

function SectionTitle({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--neutral-700)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingTop: 8,
      }}
    >
      <span>{title}</span>
      <div style={{ flex: 1 }} />
      {children}
    </div>
  )
}

function CheckboxRow({
  checked,
  onClick,
  children,
}: {
  checked: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <div onClick={onClick} style={checkboxRow(checked)}>
      <CheckMark checked={checked} />
      {children}
    </div>
  )
}

function CheckMark({ checked }: { checked: boolean }) {
  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: 4,
        flexShrink: 0,
        border: `1.5px solid ${checked ? 'var(--lg-red-600)' : 'var(--color-border)'}`,
        background: checked ? 'var(--lg-red-600)' : 'var(--white)',
        color: 'var(--white)',
        fontSize: 10,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
      }}
    >
      {checked ? '✓' : ''}
    </div>
  )
}

/* ── Styles ── */

const checkboxRow = (checked: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderRadius: 10,
  cursor: 'pointer',
  border: `1.5px solid ${checked ? 'var(--lg-red-600)' : 'var(--color-border)'}`,
  background: checked ? 'var(--lg-red-100)' : 'var(--white)',
  fontSize: 13,
  fontWeight: 500,
  color: checked ? 'var(--lg-red-700)' : 'var(--neutral-900)',
  transition: 'all 0.15s ease',
})

const personaCard = (checked: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '12px 14px',
  borderRadius: 12,
  cursor: 'pointer',
  border: `1.5px solid ${checked ? 'var(--lg-red-600)' : 'var(--color-border)'}`,
  background: checked ? 'var(--lg-red-100)' : 'var(--white)',
  transition: 'all 0.15s ease',
})

const linkBtn: CSSProperties = {
  fontSize: 11,
  color: 'var(--lg-red-600)',
  cursor: 'pointer',
  fontWeight: 600,
  background: 'none',
  border: 'none',
  padding: 0,
  textTransform: 'none',
  letterSpacing: 0,
}

const writerPersonaCard = (selected: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 10,
  cursor: 'pointer',
  border: `1.5px solid ${selected ? 'var(--lg-red-600)' : 'var(--color-border)'}`,
  background: selected ? 'var(--lg-red-100)' : 'var(--white)',
  transition: 'all 0.15s ease',
})

/* ── Writer Intro Card (선택된 작가 소개/문체) ── */

function WriterIntroCard({ persona }: { persona: AIPersona }) {
  const { t } = useTranslation()
  const color = persona.color || '#6366f1'
  return (
    <div style={writerIntroWrap(color)}>
      <div style={writerIntroHeader}>
        <span style={writerIntroIcon(color)}>✍️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={writerIntroKicker}>{t('generation:writerIntro.kicker')}</p>
          <p style={writerIntroName}>{persona.name}</p>
        </div>
        {typeof persona.temperature === 'number' && (
          <span style={writerIntroTempBadge}>
            temp · {persona.temperature}
          </span>
        )}
      </div>
      {persona.tags && persona.tags.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            marginTop: 8,
          }}
        >
          {persona.tags.map((tag) => (
            <span key={tag} style={writerIntroTag}>
              #{tag}
            </span>
          ))}
        </div>
      )}
      {persona.description && (
        <div style={writerIntroSection}>
          <p style={writerIntroSectionLabel}>{t('generation:writerIntro.introLabel')}</p>
          <div className="chat-markdown" style={{ fontSize: 13 }}>
            <Markdown>{persona.description}</Markdown>
          </div>
        </div>
      )}
      {persona.style_highlights && persona.style_highlights.length > 0 && (
        <div style={writerIntroSection}>
          <p style={writerIntroSectionLabel}>{t('generation:writerIntro.styleLabel')}</p>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 13,
              lineHeight: 1.55,
              color: 'var(--neutral-900)',
            }}
          >
            {persona.style_highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const writerIntroWrap = (color: string): CSSProperties => ({
  marginTop: 10,
  background: '#fff',
  border: '1px solid var(--color-border)',
  borderLeft: `3px solid ${color}`,
  borderRadius: 10,
  padding: '12px 14px',
  boxShadow: '0 1px 2px rgba(17,17,17,0.04)',
})

const writerIntroHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const writerIntroIcon = (color: string): CSSProperties => ({
  width: 30,
  height: 30,
  borderRadius: '50%',
  background: `${color}1a`,
  color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  flexShrink: 0,
})

const writerIntroKicker: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--neutral-500)',
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  margin: 0,
}

const writerIntroName: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--neutral-900)',
  margin: '2px 0 0 0',
  lineHeight: 1.3,
  wordBreak: 'break-word',
}

const writerIntroTempBadge: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--neutral-500)',
  background: 'var(--neutral-100)',
  padding: '3px 8px',
  borderRadius: 10,
  flexShrink: 0,
}

const writerIntroTag: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 10,
  background: 'var(--neutral-100)',
  color: 'var(--neutral-700)',
}

const writerIntroSection: CSSProperties = {
  marginTop: 10,
  paddingTop: 10,
  borderTop: '1px dashed var(--color-border)',
}

const writerIntroSectionLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--neutral-500)',
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  margin: '0 0 6px 0',
}
