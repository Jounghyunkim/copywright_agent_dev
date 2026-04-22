import { CSSProperties, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import type { SelectedCopy, Skill } from '@/shared/api/types'

import { classifyLane, getLanePreset, type Lane } from './lanes'

interface Props {
  selectedCopies: SelectedCopy[]
  skills: Skill[]
  isLoadingSkills: boolean
  isReviewing: boolean
  onRunReview: (enabledSkillIds: string[]) => void
  /** 외부에서 추천한 초기 스킬 ID (예: 국가 기반 culture-* 자동 체크). 변경 시 병합. */
  recommendedSkillIds?: string[]
}

type PresetLevel = 'light' | 'standard' | 'deep'

/** 레인별 스타일 메타만 정의. 라벨/설명은 i18n(review:lane.*)로 관리. */
const LANE_STYLE: Record<Lane, { color: string; icon: string }> = {
  risk: { color: '#dc2626', icon: '⚠️' },
  brand: { color: '#a50034', icon: '🎯' },
  craft: { color: '#0ea5e9', icon: '✨' },
  localization: { color: '#059669', icon: '🌐' },
}

const LANE_ORDER: Lane[] = ['risk', 'brand', 'craft', 'localization']

/**
 * 리뷰 실행 조건 선택 카드.
 * - 4레인(Risk / Brand / Craft / Localization) 탭 구조
 * - 레인별 Light / Standard / Deep 프리셋
 * - 레인 간 선택 상태 유지
 */
export function ReviewConfig({
  selectedCopies,
  skills,
  isLoadingSkills,
  isReviewing,
  onRunReview,
  recommendedSkillIds,
}: Props) {
  const { t } = useTranslation()
  const [enabled, setEnabled] = useState<string[]>(recommendedSkillIds ?? [])
  const [activeLane, setActiveLane] = useState<Lane>('risk')

  // 추천 스킬이 바뀌면 병합(기존 선택은 유지)
  useMemo(() => {
    if (!recommendedSkillIds || recommendedSkillIds.length === 0) return
    setEnabled((prev) => {
      const set = new Set(prev)
      recommendedSkillIds.forEach((id) => set.add(id))
      return [...set]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendedSkillIds?.join(',')])

  /* 스킬을 레인별로 분류 */
  const laneSkills = useMemo(() => {
    const buckets: Record<Lane, Skill[]> = {
      risk: [],
      brand: [],
      craft: [],
      localization: [],
    }
    for (const s of skills) {
      const lane = classifyLane(s.id)
      if (lane) buckets[lane].push(s)
    }
    return buckets
  }, [skills])

  const enabledSet = useMemo(() => new Set(enabled), [enabled])

  const toggle = (id: string) => {
    setEnabled((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const applyPreset = (lane: Lane, level: PresetLevel) => {
    const presetIds = getLanePreset(
      lane,
      level,
      laneSkills[lane].map((s) => s.id),
    )
    setEnabled((prev) => {
      // 기존 다른 레인 선택은 유지, 현재 레인은 교체
      const others = prev.filter((id) => classifyLane(id) !== lane)
      return [...others, ...presetIds]
    })
  }

  const clearLane = (lane: Lane) => {
    setEnabled((prev) => prev.filter((id) => classifyLane(id) !== lane))
  }

  const clearAll = () => setEnabled([])

  const countPerLane = (lane: Lane) =>
    laneSkills[lane].filter((s) => enabledSet.has(s.id)).length

  const activeSkills = laneSkills[activeLane]
  const activeStyle = LANE_STYLE[activeLane]

  return (
    <Card className="stack" style={{ padding: '1.2rem' }}>
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
          {t('review:config.title')}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--neutral-700)' }}>
          {t('review:config.instruction')}
        </p>
      </div>

      {/* Selected copies summary */}
      <div>
        <p style={sectionTitle}>
          {t('review:config.selectedCopies', { count: selectedCopies.length })}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selectedCopies.map((c) => (
            <Badge key={c.key} tone="primary">
              {c.key}
            </Badge>
          ))}
        </div>
      </div>

      {/* Lane tabs */}
      <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {LANE_ORDER.map((lane) => {
          const style = LANE_STYLE[lane]
          const count = countPerLane(lane)
          const isActive = activeLane === lane
          return (
            <button
              key={lane}
              type="button"
              onClick={() => setActiveLane(lane)}
              style={laneTab(isActive, style.color)}
            >
              <span aria-hidden>{style.icon}</span>
              <span>{t(`review:lane.${lane}.label`)}</span>
              {count > 0 && (
                <span style={laneTabCount(style.color)}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active lane content */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--neutral-500)', margin: 0 }}>
            {t(`review:lane.${activeLane}.description`)}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <PresetBtn
              label={t('review:preset.light')}
              title={t('review:preset.applyTooltip', { level: t('review:preset.light') })}
              onClick={() => applyPreset(activeLane, 'light')}
              color={activeStyle.color}
            />
            <PresetBtn
              label={t('review:preset.standard')}
              title={t('review:preset.applyTooltip', { level: t('review:preset.standard') })}
              onClick={() => applyPreset(activeLane, 'standard')}
              color={activeStyle.color}
              emphasized
            />
            <PresetBtn
              label={t('review:preset.deep')}
              title={t('review:preset.applyTooltip', { level: t('review:preset.deep') })}
              onClick={() => applyPreset(activeLane, 'deep')}
              color={activeStyle.color}
            />
            {countPerLane(activeLane) > 0 && (
              <button
                type="button"
                style={linkBtn}
                onClick={() => clearLane(activeLane)}
              >
                {t('review:config.clearThisLane')}
              </button>
            )}
          </div>
        </div>

        {isLoadingSkills && (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            {t('review:config.skillsLoading')}
          </p>
        )}
        {!isLoadingSkills && activeSkills.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            {t('review:config.noSkillsInLane')}
          </p>
        )}
        {activeSkills.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
            }}
          >
            {activeSkills.map((s) => {
              const checked = enabledSet.has(s.id)
              return (
                <div
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  style={skillCard(checked, activeStyle.color)}
                >
                  <div style={checkBox(checked, activeStyle.color)}>
                    {checked ? '✓' : ''}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: checked ? activeStyle.color : 'var(--neutral-900)',
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
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
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

      {/* Summary + run */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          borderTop: '1px solid var(--color-border)',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {LANE_ORDER.map((lane) => {
            const cnt = countPerLane(lane)
            if (cnt === 0) return null
            const style = LANE_STYLE[lane]
            return (
              <span key={lane} style={laneChip(style.color)}>
                {style.icon} {t(`review:lane.${lane}.label`)} · {cnt}
              </span>
            )
          })}
          {enabled.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>
              {t('review:config.selectAtLeastOne')}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {enabled.length > 0 && (
            <button type="button" style={linkBtn} onClick={clearAll}>
              {t('review:config.clearAll')}
            </button>
          )}
          <Button
            onClick={() => onRunReview(enabled)}
            disabled={
              enabled.length === 0 || isReviewing || selectedCopies.length === 0
            }
          >
            {isReviewing
              ? t('review:config.running')
              : t('review:config.runButton', { count: enabled.length })}
          </Button>
        </div>
      </div>
    </Card>
  )
}

/* ── Subcomponents ── */

function PresetBtn({
  label,
  title,
  onClick,
  color,
  emphasized,
}: {
  label: string
  title?: string
  onClick: () => void
  color: string
  emphasized?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '4px 10px',
        borderRadius: 6,
        border: `1.5px solid ${emphasized ? color : 'var(--color-border)'}`,
        background: emphasized ? `${color}15` : 'var(--white)',
        color: emphasized ? color : 'var(--neutral-700)',
        cursor: 'pointer',
        letterSpacing: 0.3,
      }}
    >
      {label}
    </button>
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
  marginBottom: 8,
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

const laneTab = (active: boolean, color: string): CSSProperties => ({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '10px 14px',
  fontSize: 12.5,
  fontWeight: 700,
  color: active ? color : 'var(--neutral-500)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  borderBottom: `2px solid ${active ? color : 'transparent'}`,
  marginBottom: -1,
  transition: 'color 0.15s ease, border-color 0.15s ease',
})

const laneTabCount = (color: string): CSSProperties => ({
  background: color,
  color: '#fff',
  fontSize: 10,
  fontWeight: 800,
  padding: '1px 6px',
  borderRadius: 8,
  minWidth: 16,
  textAlign: 'center',
  lineHeight: 1.4,
})

const laneChip = (color: string): CSSProperties => ({
  fontSize: 11,
  fontWeight: 600,
  color,
  background: `${color}15`,
  border: `1px solid ${color}40`,
  borderRadius: 12,
  padding: '3px 8px',
})

const skillCard = (checked: boolean, color: string): CSSProperties => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 10,
  cursor: 'pointer',
  border: `1.5px solid ${checked ? color : 'var(--color-border)'}`,
  background: checked ? `${color}12` : 'var(--white)',
  transition: 'all 0.15s ease',
})

const checkBox = (checked: boolean, color: string): CSSProperties => ({
  width: 16,
  height: 16,
  borderRadius: 4,
  flexShrink: 0,
  marginTop: 2,
  border: `1.5px solid ${checked ? color : 'var(--color-border)'}`,
  background: checked ? color : 'var(--white)',
  color: 'var(--white)',
  fontSize: 10,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
})
