import { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import type { Skill } from '@/shared/api/types'

interface Props {
  skills: Skill[]
  onEdit: (skill: Skill) => void
  onDelete: (skill: Skill) => void
  onView: (skill: Skill) => void
  isDeleting?: boolean
}

/** 카테고리별로 그룹핑하여 카드 그리드로 렌더링. */
export function SkillList({
  skills,
  onEdit,
  onDelete,
  onView,
  isDeleting,
}: Props) {
  const { t } = useTranslation(['skills', 'common'])
  const grouped = groupByCategory(skills)
  const categories = Object.keys(grouped).sort()

  if (skills.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
        {t('skills:empty')}
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {categories.map((cat) => (
        <div key={cat}>
          <h4 style={sectionTitle}>
            {cat}{' '}
            <span
              style={{
                fontWeight: 400,
                color: 'var(--neutral-500)',
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              ({grouped[cat].length})
            </span>
          </h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 12,
            }}
          >
            {grouped[cat].map((s) => (
              <SkillCard
                key={s.id}
                skill={s}
                onEdit={() => onEdit(s)}
                onDelete={() => onDelete(s)}
                onView={() => onView(s)}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SkillCard({
  skill: s,
  onEdit,
  onDelete,
  onView,
  isDeleting,
}: {
  skill: Skill
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  isDeleting?: boolean
}) {
  const { t } = useTranslation(['skills', 'common'])
  const isBuiltin = s.type === 'skillmd'
  return (
    <div style={cardStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <Badge tone={isBuiltin ? 'neutral' : 'primary'}>
          {isBuiltin ? 'built-in' : 'custom'}
        </Badge>
        {s.risk_level && (
          <Badge
            tone={
              s.risk_level === 'high'
                ? 'danger'
                : s.risk_level === 'medium'
                  ? 'warning'
                  : 'neutral'
            }
          >
            {s.risk_level}
          </Badge>
        )}
        {s.role_tags?.slice(0, 2).map((t) => (
          <Badge key={t} tone="neutral">
            {t}
          </Badge>
        ))}
      </div>

      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--neutral-900)',
          marginBottom: 4,
          wordBreak: 'break-word',
        }}
      >
        {s.label}
      </p>
      <p
        style={{
          fontSize: 12,
          color: 'var(--neutral-500)',
          fontFamily: 'JetBrains Mono, monospace',
          marginBottom: 8,
        }}
      >
        {s.id}
      </p>
      <p
        style={{
          fontSize: 13,
          color: 'var(--neutral-700)',
          lineHeight: 1.5,
          minHeight: 40,
        }}
      >
        {s.description}
      </p>

      <div
        style={{
          display: 'flex',
          gap: 4,
          justifyContent: 'flex-end',
          marginTop: 12,
          paddingTop: 8,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <Button variant="ghost" className="btn-compact" onClick={onView}>
          {t('common:button.detail')}
        </Button>
        {s.editable && (
          <>
            <Button variant="ghost" className="btn-compact" onClick={onEdit}>
              {t('common:button.edit')}
            </Button>
            <Button
              variant="ghost"
              className="btn-compact"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {t('common:button.delete')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function groupByCategory(skills: Skill[]): Record<string, Skill[]> {
  const out: Record<string, Skill[]> = {}
  for (const s of skills) {
    const key = s.category || 'other'
    if (!out[key]) out[key] = []
    out[key].push(s)
  }
  for (const k of Object.keys(out)) {
    out[k].sort((a, b) => a.label.localeCompare(b.label))
  }
  return out
}

/* ── Styles ── */

const cardStyle: CSSProperties = {
  background: 'var(--white)',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  padding: '14px 16px',
  boxShadow: '0 4px 12px rgba(17, 17, 17, 0.04)',
  transition: 'box-shadow 0.2s ease',
  display: 'flex',
  flexDirection: 'column',
}

const sectionTitle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--neutral-700)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 10,
  paddingBottom: 6,
  borderBottom: '1px solid var(--color-border)',
}
