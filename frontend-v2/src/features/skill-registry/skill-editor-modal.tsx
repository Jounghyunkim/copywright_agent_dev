import { CSSProperties, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal } from '@/shared/ui/modal'
import { Button } from '@/shared/ui/button'
import { FieldLabel } from '@/shared/ui/field'
import { useCreateSkill, useUpdateSkill } from '@/shared/api/hooks'
import type {
  CustomSkillCreate,
  CustomSkillUpdate,
  Skill,
} from '@/shared/api/types'

interface Props {
  /** null = 생성 모드. Skill = 편집 모드. */
  skill: Skill | null
  open: boolean
  onClose: () => void
  /** 초기값으로 적용할 draft (AI 생성 결과 또는 복사본). */
  initialDraft?: CustomSkillCreate
  onSaved?: (saved: Skill) => void
}

const CATEGORIES = ['validation', 'generation', 'analysis']

/**
 * 사용자 스킬 생성/편집 모달.
 */
export function SkillEditorModal({
  skill,
  open,
  onClose,
  initialDraft,
  onSaved,
}: Props) {
  const { t } = useTranslation(['skills', 'common'])
  const isEdit = !!skill
  const createSkill = useCreateSkill()
  const updateSkill = useUpdateSkill()

  const [id, setId] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('validation')
  const [promptTemplate, setPromptTemplate] = useState('')
  const [outputSchemaText, setOutputSchemaText] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!open) return
    if (skill) {
      setId(skill.id)
      setLabel(skill.label ?? '')
      setDescription(skill.description ?? '')
      setCategory(skill.category ?? 'validation')
      setPromptTemplate(skill.prompt_template ?? '')
      setOutputSchemaText(
        skill.output_schema
          ? JSON.stringify(skill.output_schema, null, 2)
          : '',
      )
      setIsActive(skill.is_active !== false)
    } else if (initialDraft) {
      setId(initialDraft.id ?? '')
      setLabel(initialDraft.label ?? '')
      setDescription(initialDraft.description ?? '')
      setCategory(initialDraft.category ?? 'validation')
      setPromptTemplate(initialDraft.prompt_template ?? '')
      setOutputSchemaText(
        initialDraft.output_schema
          ? JSON.stringify(initialDraft.output_schema, null, 2)
          : '',
      )
      setIsActive(true)
    } else {
      setId('')
      setLabel('')
      setDescription('')
      setCategory('validation')
      setPromptTemplate('')
      setOutputSchemaText('')
      setIsActive(true)
    }
    setJsonError(null)
  }, [open, skill, initialDraft])

  const parseSchema = (): Record<string, unknown> | null | 'error' => {
    const text = outputSchemaText.trim()
    if (!text) return null
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed !== 'object' || parsed == null || Array.isArray(parsed)) {
        return 'error'
      }
      return parsed as Record<string, unknown>
    } catch {
      return 'error'
    }
  }

  const canSubmit =
    id.trim().length >= 3 &&
    label.trim().length > 0 &&
    description.trim().length > 0 &&
    promptTemplate.trim().length > 0

  const busy = createSkill.isPending || updateSkill.isPending

  const handleSubmit = async () => {
    const schema = parseSchema()
    if (schema === 'error') {
      setJsonError(t('skills:editor.error.invalidSchema'))
      return
    }
    setJsonError(null)

    try {
      if (isEdit && skill) {
        const body: CustomSkillUpdate = {
          label,
          description,
          category,
          prompt_template: promptTemplate,
          output_schema: schema,
          is_active: isActive,
        }
        const saved = await updateSkill.mutateAsync({ id: skill.id, body })
        onSaved?.(saved)
      } else {
        const body: CustomSkillCreate = {
          id,
          label,
          description,
          category,
          prompt_template: promptTemplate,
          output_schema: schema,
        }
        const saved = await createSkill.mutateAsync(body)
        onSaved?.(saved)
      }
      onClose()
    } catch (err) {
      console.error('[SkillEditorModal] save failed', err)
      alert(t('skills:editor.error.saveFailed'))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('skills:editor.titleEdit') : t('skills:editor.titleNew')}
      width={680}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <FieldLabel>
            {t('skills:editor.idLabel')}{' '}
            <span style={{ color: 'var(--lg-red-600)' }}>*</span>{' '}
            <span
              style={{
                fontSize: 11,
                fontWeight: 400,
                color: 'var(--neutral-500)',
              }}
            >
              {t('skills:editor.idHint')}
            </span>
          </FieldLabel>
          <input
            className="input"
            value={id}
            disabled={isEdit}
            onChange={(e) =>
              setId(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, '-')
                  .replace(/-+/g, '-'),
              )
            }
            placeholder={t('skills:editor.idPlaceholder')}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
        </div>

        <div>
          <FieldLabel>
            {t('skills:editor.labelLabel')}{' '}
            <span style={{ color: 'var(--lg-red-600)' }}>*</span>
          </FieldLabel>
          <input
            className="input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('skills:editor.labelPlaceholder')}
          />
        </div>

        <div>
          <FieldLabel>
            {t('skills:editor.descriptionLabel')}{' '}
            <span style={{ color: 'var(--lg-red-600)' }}>*</span>
          </FieldLabel>
          <textarea
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('skills:editor.descriptionPlaceholder')}
            rows={3}
            style={{ minHeight: 80 }}
          />
        </div>

        <div>
          <FieldLabel>{t('skills:editor.categoryLabel')}</FieldLabel>
          <select
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>
            {t('skills:editor.promptLabel')}{' '}
            <span style={{ color: 'var(--lg-red-600)' }}>*</span>
          </FieldLabel>
          <textarea
            className="textarea"
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            placeholder={t('skills:editor.promptPlaceholder', {
              copy: '{{copy}}',
            })}
            style={{
              minHeight: 160,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12.5,
            }}
          />
        </div>

        <div>
          <FieldLabel>{t('skills:editor.outputSchemaLabel')}</FieldLabel>
          <textarea
            className="textarea"
            value={outputSchemaText}
            onChange={(e) => setOutputSchemaText(e.target.value)}
            placeholder={'{\n  "score": "number",\n  "passed": "boolean"\n}'}
            style={{
              minHeight: 140,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12.5,
            }}
          />
          {jsonError && (
            <p
              style={{
                fontSize: 12,
                color: 'var(--danger)',
                marginTop: 4,
              }}
            >
              {jsonError}
            </p>
          )}
        </div>

        {isEdit && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>{t('skills:editor.activateLabel')}</span>
          </label>
        )}
      </div>

      <div style={footerRow}>
        <Button variant="ghost" onClick={onClose}>
          {t('common:button.cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || busy}>
          {busy
            ? t('common:button.saving')
            : isEdit
              ? t('common:button.update')
              : t('common:button.save')}
        </Button>
      </div>
    </Modal>
  )
}

const footerRow: CSSProperties = {
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
  marginTop: 16,
  paddingTop: 12,
  borderTop: '1px solid var(--color-border)',
}
