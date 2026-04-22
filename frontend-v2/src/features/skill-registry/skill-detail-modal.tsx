import { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal } from '@/shared/ui/modal'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import type { Skill } from '@/shared/api/types'

interface Props {
  skill: Skill | null
  onClose: () => void
  onEdit?: (skill: Skill) => void
}

/** 스킬 상세 보기 (읽기 전용). */
export function SkillDetailModal({ skill, onClose, onEdit }: Props) {
  const { t } = useTranslation(['skills', 'common'])
  if (!skill) return null

  return (
    <Modal
      open={!!skill}
      onClose={onClose}
      title={skill.label}
      width={680}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge tone={skill.type === 'skillmd' ? 'neutral' : 'primary'}>
            {skill.type === 'skillmd'
              ? t('skills:card.typeBuiltin')
              : t('skills:card.typeCustom')}
          </Badge>
          <Badge tone="neutral">{skill.category}</Badge>
          {skill.risk_level && (
            <Badge
              tone={
                skill.risk_level === 'high'
                  ? 'danger'
                  : skill.risk_level === 'medium'
                    ? 'warning'
                    : 'neutral'
              }
            >
              {t('skills:detail.riskLabel', { level: skill.risk_level })}
            </Badge>
          )}
          {skill.is_active === false && (
            <Badge tone="danger">{t('skills:card.inactive')}</Badge>
          )}
        </div>

        <Field label={t('skills:detail.idLabel')} value={skill.id} mono />
        <Field
          label={t('skills:detail.descriptionLabel')}
          value={skill.description}
          multiline
        />

        {!!skill.action_tags?.length && (
          <Field label={t('skills:detail.actionTags')} tags={skill.action_tags} />
        )}
        {!!skill.role_tags?.length && (
          <Field label={t('skills:detail.roleTags')} tags={skill.role_tags} />
        )}
        {!!skill.reference_docs?.length && (
          <Field
            label={t('skills:detail.referenceDocs')}
            tags={skill.reference_docs}
            mono
          />
        )}

        {skill.prompt_template && (
          <Field
            label={t('skills:detail.promptTemplate')}
            value={skill.prompt_template}
            multiline
            mono
          />
        )}

        {skill.output_schema && (
          <Field
            label={t('skills:detail.outputSchema')}
            value={JSON.stringify(skill.output_schema, null, 2)}
            multiline
            mono
          />
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'flex-end',
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        {skill.editable && onEdit && (
          <Button
            variant="ghost"
            onClick={() => {
              onEdit(skill)
              onClose()
            }}
          >
            {t('common:button.edit')}
          </Button>
        )}
        <Button onClick={onClose}>{t('common:button.close')}</Button>
      </div>
    </Modal>
  )
}

function Field({
  label,
  value,
  tags,
  multiline,
  mono,
}: {
  label: string
  value?: string
  tags?: string[]
  multiline?: boolean
  mono?: boolean
}) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      {tags ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {tags.map((t) => (
            <Badge key={t} tone="neutral">
              <span style={mono ? { fontFamily: 'JetBrains Mono, monospace' } : {}}>
                {t}
              </span>
            </Badge>
          ))}
        </div>
      ) : (
        <p
          style={{
            fontSize: 13,
            color: 'var(--neutral-900)',
            lineHeight: 1.6,
            whiteSpace: multiline ? 'pre-wrap' : undefined,
            fontFamily: mono
              ? 'JetBrains Mono, monospace'
              : 'inherit',
            background: multiline ? 'var(--neutral-100)' : undefined,
            padding: multiline ? '8px 12px' : 0,
            borderRadius: multiline ? 8 : 0,
            margin: 0,
            wordBreak: 'break-word',
          }}
        >
          {value}
        </p>
      )}
    </div>
  )
}

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--neutral-700)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 4,
}
