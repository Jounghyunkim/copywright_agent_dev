import { CSSProperties, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal } from '@/shared/ui/modal'
import { Button } from '@/shared/ui/button'
import { FieldLabel } from '@/shared/ui/field'
import { useGenerateSkillDraft } from '@/shared/api/hooks'
import type { CustomSkillCreate } from '@/shared/api/types'

interface Props {
  open: boolean
  onClose: () => void
  /** 초안 생성 완료 시 호출. 부모가 SkillEditorModal로 연결. */
  onDraftReady: (draft: CustomSkillCreate) => void
}

/**
 * AI 스킬 초안 생성 위자드.
 * 이름/목적/목표/예시를 입력 → `/api/v1/skills/generate-draft` → 초안 모달에 전달.
 */
export function SkillDraftWizard({ open, onClose, onDraftReady }: Props) {
  const { t } = useTranslation(['skills', 'common'])
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [goal, setGoal] = useState('')
  const [goodExample, setGoodExample] = useState('')
  const [badExample, setBadExample] = useState('')

  const generate = useGenerateSkillDraft()

  const canSubmit =
    name.trim().length >= 2 &&
    purpose.trim().length >= 10 &&
    goal.trim().length >= 10

  const handleGenerate = async () => {
    if (!canSubmit) return
    try {
      const res = await generate.mutateAsync({
        name: name.trim(),
        purpose: purpose.trim(),
        goal: goal.trim(),
        goodExample: goodExample.trim() || undefined,
        badExample: badExample.trim() || undefined,
      })
      if (res.draft) {
        onDraftReady(res.draft)
        // 위자드 필드 초기화
        setName('')
        setPurpose('')
        setGoal('')
        setGoodExample('')
        setBadExample('')
        onClose()
      } else {
        alert(t('skills:wizard.error.draftFailedNull'))
      }
    } catch (err) {
      console.error('[SkillDraftWizard] generate failed', err)
      alert(t('skills:wizard.error.draftFailed'))
    }
  }

  return (
    <Modal
      open={open}
      onClose={generate.isPending ? () => {} : onClose}
      title={t('skills:wizard.title')}
      width={680}
    >
      <p
        style={{
          fontSize: 13,
          color: 'var(--neutral-700)',
          marginBottom: 12,
          lineHeight: 1.6,
        }}
      >
        {t('skills:wizard.intro')}
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <FieldLabel>
            {t('skills:wizard.nameLabel')} <span style={req}>*</span>
          </FieldLabel>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('skills:wizard.namePlaceholder')}
            disabled={generate.isPending}
          />
        </div>

        <div>
          <FieldLabel>
            {t('skills:wizard.purposeLabel')} <span style={req}>*</span>{' '}
            <span style={hint}>{t('skills:wizard.purposeHint')}</span>
          </FieldLabel>
          <textarea
            className="textarea"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder={t('skills:wizard.purposePlaceholder')}
            rows={3}
            style={{ minHeight: 80 }}
            disabled={generate.isPending}
          />
        </div>

        <div>
          <FieldLabel>
            {t('skills:wizard.goalLabel')} <span style={req}>*</span>{' '}
            <span style={hint}>{t('skills:wizard.goalHint')}</span>
          </FieldLabel>
          <textarea
            className="textarea"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={t('skills:wizard.goalPlaceholder')}
            rows={3}
            style={{ minHeight: 80 }}
            disabled={generate.isPending}
          />
        </div>

        <div>
          <FieldLabel>
            {t('skills:wizard.goodExampleLabel')}{' '}
            <span style={hint}>{t('skills:wizard.goodExampleHint')}</span>
          </FieldLabel>
          <textarea
            className="textarea"
            value={goodExample}
            onChange={(e) => setGoodExample(e.target.value)}
            placeholder={t('skills:wizard.goodExamplePlaceholder')}
            rows={2}
            style={{ minHeight: 60 }}
            disabled={generate.isPending}
          />
        </div>

        <div>
          <FieldLabel>
            {t('skills:wizard.badExampleLabel')}{' '}
            <span style={hint}>{t('skills:wizard.badExampleHint')}</span>
          </FieldLabel>
          <textarea
            className="textarea"
            value={badExample}
            onChange={(e) => setBadExample(e.target.value)}
            placeholder={t('skills:wizard.badExamplePlaceholder')}
            rows={2}
            style={{ minHeight: 60 }}
            disabled={generate.isPending}
          />
        </div>
      </div>

      <div style={footerRow}>
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={generate.isPending}
        >
          {t('common:button.cancel')}
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={!canSubmit || generate.isPending}
        >
          {generate.isPending
            ? t('skills:button.draftGenerating')
            : t('skills:button.draftGenerate')}
        </Button>
      </div>
    </Modal>
  )
}

const req: CSSProperties = {
  color: 'var(--lg-red-600)',
  marginLeft: 2,
}

const hint: CSSProperties = {
  fontSize: 11,
  fontWeight: 400,
  color: 'var(--neutral-500)',
  marginLeft: 4,
}

const footerRow: CSSProperties = {
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
  marginTop: 16,
  paddingTop: 12,
  borderTop: '1px solid var(--color-border)',
}
