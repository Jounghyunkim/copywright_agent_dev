import { CSSProperties, useState } from 'react'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import type { SelectedCopy, Skill } from '@/shared/api/types'

interface Props {
  selectedCopies: SelectedCopy[]
  skills: Skill[]
  isLoadingSkills: boolean
  isReviewing: boolean
  onRunReview: (enabledSkillIds: string[]) => void
}

/**
 * 리뷰 실행 조건 선택 카드.
 * - 선택된 카피 목록 표시 (읽기 전용)
 * - 사용 가능한 스킬 목록에서 다중 선택
 * - "리뷰 시작" 버튼으로 onRunReview 호출
 */
export function ReviewConfig({
  selectedCopies,
  skills,
  isLoadingSkills,
  isReviewing,
  onRunReview,
}: Props) {
  const [enabled, setEnabled] = useState<string[]>([])

  const toggle = (id: string) => {
    setEnabled((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleAll = () => {
    setEnabled(enabled.length === skills.length ? [] : skills.map((s) => s.id))
  }

  return (
    <Card className="stack" style={{ padding: '1.2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            리뷰 조건 설정
          </h3>
          <p style={{ fontSize: 13, color: 'var(--neutral-700)' }}>
            선택한 카피에 적용할 스킬을 고르고 리뷰를 실행하세요.
          </p>
        </div>
      </div>

      {/* Selected copies summary */}
      <div>
        <p style={sectionTitle}>선택된 카피 ({selectedCopies.length}개)</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selectedCopies.map((c) => (
            <Badge key={c.key} tone="primary">
              {c.key}
            </Badge>
          ))}
        </div>
      </div>

      {/* Skill selection */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <p style={sectionTitle}>리뷰 스킬 ({enabled.length}개 선택)</p>
          <div style={{ flex: 1 }} />
          {skills.length > 0 && (
            <button type="button" style={linkBtn} onClick={toggleAll}>
              {enabled.length === skills.length ? '전체 해제' : '전체 선택'}
            </button>
          )}
        </div>
        {isLoadingSkills && (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            스킬 목록 로드 중…
          </p>
        )}
        {!isLoadingSkills && skills.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            등록된 스킬이 없습니다.
          </p>
        )}
        {skills.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
            }}
          >
            {skills.map((s) => {
              const checked = enabled.includes(s.id)
              return (
                <div
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  style={skillCard(checked)}
                >
                  <div style={checkBox(checked)}>{checked ? '✓' : ''}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: checked
                          ? 'var(--lg-red-700)'
                          : 'var(--neutral-900)',
                        margin: 0,
                      }}
                    >
                      {s.label}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--neutral-500)',
                        margin: '2px 0 0 0',
                      }}
                    >
                      {s.description}
                    </p>
                  </div>
                  <Badge tone={s.type === 'skillmd' ? 'neutral' : 'primary'}>
                    {s.type === 'skillmd' ? 'built-in' : 'custom'}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
          onClick={() => onRunReview(enabled)}
          disabled={enabled.length === 0 || isReviewing || selectedCopies.length === 0}
        >
          {isReviewing ? '리뷰 실행 중…' : '⑤ 리뷰 시작'}
        </Button>
      </div>
    </Card>
  )
}

/* ── Styles ── */

const sectionTitle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--neutral-700)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  margin: 0,
}

const linkBtn: CSSProperties = {
  fontSize: 11,
  color: 'var(--lg-red-600)',
  cursor: 'pointer',
  fontWeight: 600,
  background: 'none',
  border: 'none',
  padding: 0,
}

const skillCard = (checked: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 10,
  cursor: 'pointer',
  border: `1.5px solid ${checked ? 'var(--lg-red-600)' : 'var(--color-border)'}`,
  background: checked ? 'var(--lg-red-100)' : 'var(--white)',
  transition: 'all 0.15s ease',
})

const checkBox = (checked: boolean): CSSProperties => ({
  width: 16,
  height: 16,
  borderRadius: 4,
  flexShrink: 0,
  marginTop: 2,
  border: `1.5px solid ${checked ? 'var(--lg-red-600)' : 'var(--color-border)'}`,
  background: checked ? 'var(--lg-red-600)' : 'var(--white)',
  color: 'var(--white)',
  fontSize: 10,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
})
