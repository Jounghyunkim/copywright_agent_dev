import { CSSProperties, useState } from 'react'

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
        alert('초안을 생성하지 못했습니다.')
      }
    } catch (err) {
      console.error('[SkillDraftWizard] generate failed', err)
      alert('초안 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={generate.isPending ? () => {} : onClose}
      title="AI 스킬 초안 생성"
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
        간단한 정보를 입력하면 AI가 ID/라벨/설명/프롬프트 템플릿/Output Schema
        초안을 생성합니다. 생성 후 편집 화면에서 자유롭게 수정할 수 있습니다.
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <FieldLabel>
            스킬 이름 <span style={req}>*</span>
          </FieldLabel>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 프로모션 법률 검증"
            disabled={generate.isPending}
          />
        </div>

        <div>
          <FieldLabel>
            작성 목적 <span style={req}>*</span>{' '}
            <span style={hint}>왜 이 스킬을 만드는지</span>
          </FieldLabel>
          <textarea
            className="textarea"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="예: 프로모션 카피에 포함된 법적 리스크 표현을 사전 필터링해 컴플라이언스 리뷰 부담을 줄이기 위함"
            rows={3}
            style={{ minHeight: 80 }}
            disabled={generate.isPending}
          />
        </div>

        <div>
          <FieldLabel>
            스킬 목적 <span style={req}>*</span>{' '}
            <span style={hint}>이 스킬이 달성해야 하는 것</span>
          </FieldLabel>
          <textarea
            className="textarea"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="예: 과장 광고, 허위 비교, 불법 보증 등 법적 위험 표현을 식별하고 점수/강점/개선안을 제공"
            rows={3}
            style={{ minHeight: 80 }}
            disabled={generate.isPending}
          />
        </div>

        <div>
          <FieldLabel>
            좋은 예시 <span style={hint}>(선택)</span>
          </FieldLabel>
          <textarea
            className="textarea"
            value={goodExample}
            onChange={(e) => setGoodExample(e.target.value)}
            placeholder="예: '동급 대비 우수한 화질'"
            rows={2}
            style={{ minHeight: 60 }}
            disabled={generate.isPending}
          />
        </div>

        <div>
          <FieldLabel>
            나쁜 예시 <span style={hint}>(선택)</span>
          </FieldLabel>
          <textarea
            className="textarea"
            value={badExample}
            onChange={(e) => setBadExample(e.target.value)}
            placeholder="예: '세계 최고의 화질, 다른 모든 제품을 압도'"
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
          취소
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={!canSubmit || generate.isPending}
        >
          {generate.isPending ? '초안 생성 중…' : '✦ 초안 생성'}
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
