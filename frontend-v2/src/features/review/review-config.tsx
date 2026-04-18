import { CSSProperties, useMemo, useState } from 'react'

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

const LANE_META: Record<
  Lane,
  { label: string; color: string; icon: string; description: string }
> = {
  risk: {
    label: 'Risk & Compliance',
    color: '#dc2626',
    icon: '⚠️',
    description: '법무·규제·허위 주장 리스크를 탐지합니다.',
  },
  brand: {
    label: 'Brand Integrity',
    color: '#a50034',
    icon: '🎯',
    description: 'LG 브랜드 톤·사전·보이스 정합성을 검증합니다.',
  },
  craft: {
    label: 'Craft Quality',
    color: '#0ea5e9',
    icon: '✨',
    description: '카피의 명확성·임팩트·세그먼트 적합도를 평가합니다.',
  },
  localization: {
    label: 'Localization',
    color: '#059669',
    icon: '🌐',
    description: '국가·문화·언어 현지화 품질을 확인합니다.',
  },
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
  const activeMeta = LANE_META[activeLane]

  return (
    <Card className="stack" style={{ padding: '1.2rem' }}>
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
          리뷰 조건 설정
        </h3>
        <p style={{ fontSize: 13, color: 'var(--neutral-700)' }}>
          검증 레인을 선택해 적용할 스킬을 구성하세요. 프리셋으로 한 번에
          선택할 수도 있습니다.
        </p>
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

      {/* Lane tabs */}
      <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {LANE_ORDER.map((lane) => {
          const meta = LANE_META[lane]
          const count = countPerLane(lane)
          const isActive = activeLane === lane
          return (
            <button
              key={lane}
              type="button"
              onClick={() => setActiveLane(lane)}
              style={laneTab(isActive, meta.color)}
            >
              <span aria-hidden>{meta.icon}</span>
              <span>{meta.label}</span>
              {count > 0 && (
                <span style={laneTabCount(meta.color)}>{count}</span>
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
            {activeMeta.description}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <PresetBtn
              label="Light"
              onClick={() => applyPreset(activeLane, 'light')}
              color={activeMeta.color}
            />
            <PresetBtn
              label="Standard"
              onClick={() => applyPreset(activeLane, 'standard')}
              color={activeMeta.color}
              emphasized
            />
            <PresetBtn
              label="Deep"
              onClick={() => applyPreset(activeLane, 'deep')}
              color={activeMeta.color}
            />
            {countPerLane(activeLane) > 0 && (
              <button
                type="button"
                style={linkBtn}
                onClick={() => clearLane(activeLane)}
              >
                이 레인 해제
              </button>
            )}
          </div>
        </div>

        {isLoadingSkills && (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            스킬 목록 로드 중…
          </p>
        )}
        {!isLoadingSkills && activeSkills.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
            이 레인에 등록된 스킬이 없습니다.
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
                  style={skillCard(checked, activeMeta.color)}
                >
                  <div style={checkBox(checked, activeMeta.color)}>
                    {checked ? '✓' : ''}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: checked ? activeMeta.color : 'var(--neutral-900)',
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
            const meta = LANE_META[lane]
            return (
              <span key={lane} style={laneChip(meta.color)}>
                {meta.icon} {meta.label} · {cnt}
              </span>
            )
          })}
          {enabled.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>
              스킬을 1개 이상 선택해 주세요.
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {enabled.length > 0 && (
            <button type="button" style={linkBtn} onClick={clearAll}>
              전체 해제
            </button>
          )}
          <Button
            onClick={() => onRunReview(enabled)}
            disabled={
              enabled.length === 0 || isReviewing || selectedCopies.length === 0
            }
          >
            {isReviewing ? '리뷰 실행 중…' : `⑤ 리뷰 시작 (${enabled.length})`}
          </Button>
        </div>
      </div>
    </Card>
  )
}

/* ── Subcomponents ── */

function PresetBtn({
  label,
  onClick,
  color,
  emphasized,
}: {
  label: string
  onClick: () => void
  color: string
  emphasized?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
      title={`이 레인의 ${label} 프리셋 적용`}
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
