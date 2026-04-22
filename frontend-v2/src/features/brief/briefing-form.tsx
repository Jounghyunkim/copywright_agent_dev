import { CSSProperties, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { FieldLabel } from '@/shared/ui/field'
import { useGenerateBrief } from '@/shared/api/hooks'
import type {
  CampaignBrief,
  MessageMatrixProduct,
} from '@/shared/api/types'
import {
  type BriefField,
  type BriefSection,
  INITIAL_BRIEF,
  SECTIONS,
  isBriefValid,
  isSectionRequired,
  sectionHasEmpty,
} from '@/features/brief/sections'
import {
  MessageMatrixUpload,
  matrixToBriefSeed,
} from '@/features/message-matrix'

import { GuideModal } from './guide-modal'

interface Props {
  /** 부모가 이미 가지고 있는 초기 brief (옵션). */
  initialBrief?: CampaignBrief
  /** 폼 내용이 바뀔 때마다 부모에 통지. */
  onChange?: (brief: CampaignBrief) => void
  /** 제출(=분석 시작) 버튼 클릭 시 호출. */
  onSubmit?: (brief: CampaignBrief) => void
  /** Message Matrix가 새로 파싱되었을 때 부모에 전달. 분석 호출 시 함께 전송하기 위함. */
  onMatrixParsed?: (matrix: Record<string, MessageMatrixProduct> | null) => void
  /** 가이드 (?) 클릭 시 제목+내용을 부모에 전달 → 채팅 패널에 표시. */
  onGuideRequest?: (title: string, guide: string) => void
  /** 미리보기 클릭 시 부모에 brief를 전달 → 패널 내 인라인 프리뷰 표시. */
  onPreview?: (brief: CampaignBrief) => void
  /** 상위에서 분석 중임을 표시. 버튼 비활성 및 로딩 문구 전환. */
  isAnalyzing?: boolean
  /** 전체 폼 비활성화. */
  isDisabled?: boolean
}

/**
 * 9-섹션 접이식 Campaign Brief 입력 폼.
 * - 섹션별 접기/펴기
 * - required 필드 빈 값에 빨간 외곽선
 * - Project Context 섹션 뒤에 AI 자동생성 버튼
 * - 각 섹션 guide 아이콘 → GuideModal
 * - 상단 Preview 버튼 → PreviewModal
 */
export function BriefingForm({
  initialBrief,
  onChange,
  onSubmit,
  onMatrixParsed,
  onGuideRequest,
  onPreview,
  isAnalyzing = false,
  isDisabled = false,
}: Props) {
  const { t } = useTranslation()
  const [brief, setBrief] = useState<CampaignBrief>(
    () => initialBrief ?? INITIAL_BRIEF,
  )
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [guideSection, setGuideSection] = useState<BriefSection | null>(null)

  const generateBrief = useGenerateBrief()

  const valid = useMemo(() => isBriefValid(brief), [brief])

  const updateField = (name: keyof CampaignBrief, value: string) => {
    setBrief((prev) => {
      const next = { ...prev, [name]: value }
      onChange?.(next)
      return next
    })
  }

  const toggleSection = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleAutoGenerate = async () => {
    const name = brief.projectName.trim()
    const context = brief.projectContext.trim()
    if (!name || !context) {
      alert(t('brief:form.error.nameAndContextRequired'))
      return
    }
    if (name.length < 3 || new Set(name.replace(/\s/g, '')).size <= 1) {
      alert(t('brief:form.error.projectNameShort'))
      return
    }
    if (context.length < 20 || context.split(/\s+/).filter(Boolean).length < 5) {
      alert(t('brief:form.error.contextShort'))
      return
    }
    try {
      const result = await generateBrief.mutateAsync({
        projectName: name,
        projectContext: context,
      })
      if (result.status === 'success' && result.data) {
        setBrief((prev) => {
          const next = {
            ...prev,
            ...result.data,
            projectName: prev.projectName,
            projectContext: prev.projectContext,
            date: prev.date,
          } as CampaignBrief
          onChange?.(next)
          return next
        })
        setCollapsed({})
        setSubmitted(false)
      }
    } catch (err) {
      console.error('[BriefingForm] auto-generate failed', err)
      alert(t('brief:form.error.autogenFailed'))
    }
  }

  const handleMatrixParsed = (
    matrix: Record<string, MessageMatrixProduct>,
  ) => {
    onMatrixParsed?.(matrix)
    const seed = matrixToBriefSeed(matrix)
    if (!seed) return
    setBrief((prev) => {
      const next: CampaignBrief = {
        ...prev,
        // 기존 입력값이 있으면 보존, 비어 있을 때만 채움
        projectName: prev.projectName.trim()
          ? prev.projectName
          : seed.projectName,
        projectContext: prev.projectContext.trim()
          ? prev.projectContext
          : seed.projectContext,
      }
      onChange?.(next)
      return next
    })
    setCollapsed({})
    setSubmitted(false)
  }

  const handleSubmit = () => {
    if (!valid) {
      setSubmitted(true)
      // 첫 번째 미완성 필수 섹션 자동 펼치기
      for (const s of SECTIONS) {
        if (sectionHasEmpty(s, brief)) {
          setCollapsed((prev) => ({ ...prev, [s.id]: false }))
          break
        }
      }
      return
    }
    onSubmit?.(brief)
  }

  return (
    <Card className="stack" style={{ padding: '1.2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            LG Campaign Research
          </h3>
          <p style={{ fontSize: 12, color: 'var(--neutral-700)' }}>
            {t('brief:form.instruction')}
          </p>
        </div>
        <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>
          {t('brief:form.createdDate', { date: brief.date.replace(/-/g, '.') })}
        </span>
      </div>

      {/* Message Matrix 업로드 영역 */}
      <div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--neutral-700)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 6,
          }}
        >
          {t('brief:form.messageMatrix.label')}
        </p>
        <p
          style={{
            fontSize: 12,
            color: 'var(--neutral-500)',
            marginBottom: 8,
          }}
        >
          {t('brief:form.messageMatrix.help')}
        </p>
        <MessageMatrixUpload
          onParsed={handleMatrixParsed}
          isDisabled={isDisabled}
        />
      </div>

      <div style={{ display: 'grid', gap: 4 }}>
        {SECTIONS.map((section) => {
          const isCollapsed = !!collapsed[section.id]
          const hasEmpty = submitted && sectionHasEmpty(section, brief)
          const required = isSectionRequired(section)

          return (
            <div key={section.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--color-border)',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    flex: 1,
                  }}
                  onClick={() => toggleSection(section.id)}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--neutral-900)',
                      letterSpacing: 0.3,
                    }}
                  >
                    {t(section.titleKey)}
                    {required && (
                      <span style={{ color: 'var(--lg-red-600)', marginLeft: 2 }}>*</span>
                    )}
                  </p>
                  {section.guideKey && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onGuideRequest) {
                          onGuideRequest(
                            t(section.titleKey),
                            t(section.guideKey!),
                          )
                        } else {
                          setGuideSection(section)
                        }
                      }}
                      style={guideBtn}
                      title={t('brief:form.button.viewGuide')}
                    >
                      ?
                    </button>
                  )}
                  {hasEmpty && isCollapsed && <span style={dotStyle} />}
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    color: 'var(--neutral-500)',
                    fontSize: 12,
                  }}
                  aria-label={t('brief:form.button.expandCollapse')}
                >
                  {isCollapsed ? '▸' : '▾'}
                </button>
              </div>

              {!isCollapsed && (
                <div style={{ padding: '6px 0 12px 0', display: 'grid', gap: 8 }}>
                  {section.fields.map((f) => (
                    <FieldRow
                      key={f.name}
                      field={f}
                      value={brief[f.name] ?? ''}
                      onChange={(v) => updateField(f.name, v)}
                      invalid={submitted && !!f.required && (brief[f.name] ?? '').trim() === ''}
                      disabled={isDisabled}
                    />
                  ))}
                </div>
              )}

              {section.id === 'context' && !isDisabled && (
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  disabled={generateBrief.isPending}
                  style={autoGenBtn(generateBrief.isPending)}
                >
                  {generateBrief.isPending
                    ? `✦ ${t('brief:form.button.generating')}`
                    : `✦ ${t('brief:form.button.autoGenerate')}`}
                </button>
              )}
            </div>
          )
        })}
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
          variant="ghost"
          onClick={() => onPreview?.(brief)}
          type="button"
        >
          {t('brief:form.button.preview')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isDisabled || isAnalyzing}
          type="button"
        >
          {isAnalyzing ? t('workflow:loading.analyzing') : t('brief:form.button.run')}
        </Button>
      </div>

      <GuideModal
        section={guideSection}
        onClose={() => setGuideSection(null)}
      />
    </Card>
  )
}

/* ── Internal field renderer ── */

function FieldRow({
  field,
  value,
  onChange,
  invalid,
  disabled,
}: {
  field: BriefField
  value: string
  onChange: (v: string) => void
  invalid: boolean
  disabled: boolean
}) {
  const { t } = useTranslation()
  const placeholder = t(field.placeholderKey)
  const commonStyle: CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${invalid ? 'var(--lg-red-600)' : 'var(--color-border)'}`,
    fontSize: 14,
    outline: 'none',
    background: disabled ? '#f8f9fa' : 'var(--white)',
    color: 'var(--neutral-900)',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    lineHeight: 1.5,
    resize: field.type === 'textarea' ? 'vertical' : undefined,
    minHeight: field.type === 'textarea' ? `${(field.rows ?? 4) * 26}px` : undefined,
    transition: 'border-color 0.2s ease',
  }

  return (
    <div>
      {field.labelKey && (
        <FieldLabel>
          {t(field.labelKey)}
          {field.required && (
            <span style={{ color: 'var(--lg-red-600)', marginLeft: 2 }}>*</span>
          )}
        </FieldLabel>
      )}
      {field.type === 'textarea' ? (
        <textarea
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={commonStyle}
          rows={field.rows ?? 4}
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={commonStyle}
        />
      )}
    </div>
  )
}

/* ── Inline styles ── */

const guideBtn: CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: '50%',
  border: '1px solid var(--color-border)',
  background: 'var(--white)',
  color: 'var(--neutral-500)',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  lineHeight: 1,
}

const dotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: 'var(--lg-red-600)',
  flexShrink: 0,
}

const autoGenBtn = (loading: boolean): CSSProperties => ({
  width: '100%',
  padding: '10px 16px',
  marginTop: 8,
  marginBottom: 4,
  borderRadius: 10,
  border: '1px dashed var(--lg-red-600)',
  background: '#fff8fa',
  color: 'var(--lg-red-700)',
  fontSize: 13,
  fontWeight: 700,
  cursor: loading ? 'not-allowed' : 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  opacity: loading ? 0.6 : 1,
  transition: 'background-color 0.2s ease',
})
