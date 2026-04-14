import { CSSProperties, useState } from 'react'

import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import type { GenerationConfig as GenerationConfigT } from '@/shared/api/types'

import { AGE_GROUPS, COUNTRIES, TARGET_PERSONAS } from './constants'

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
export function GenerationConfig({ onSubmit, isGenerating = false }: Props) {
  const [countries, setCountries] = useState<string[]>([])
  const [ages, setAges] = useState<string[]>([])
  const [personas, setPersonas] = useState<string[]>([])
  const [copyCount, setCopyCount] = useState(3)

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
    })
  }

  return (
    <Card className="stack" style={{ padding: '1.2rem' }}>
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
          카피 생성 조건
        </h3>
        <p style={{ fontSize: 13, color: 'var(--neutral-700)' }}>
          타겟 국가/연령/페르소나를 선택하고 카피 변형 수를 지정하세요.
        </p>
      </div>

      {/* Countries */}
      <SectionTitle title="타겟 국가">
        <button type="button" style={linkBtn} onClick={toggleAllCountries}>
          {countries.length === COUNTRIES.length ? '전체 해제' : '전체 선택'}
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
            <span style={{ fontSize: 16 }}>{c.flag}</span>
            <span>{c.label}</span>
          </CheckboxRow>
        ))}
      </div>

      {/* Age Groups */}
      <SectionTitle title="타겟 연령대" />
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
      <SectionTitle title="타겟 페르소나" />
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
                {p.label}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--neutral-500)',
                  margin: '2px 0 0 0',
                }}
              >
                {p.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

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
          변형 수
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
          {isGenerating ? '생성 중…' : `카피 생성 →`}
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
          국가/연령/페르소나를 각각 1개 이상 선택해 주세요.
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
