import { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { useCorrectCopy } from '@/shared/api/hooks'
import type {
  CopyItem,
  CorrectionResponse,
  ReviewResult,
  SelectedCopy,
} from '@/shared/api/types'
import { countryMeta } from '@/features/copy-generation'

interface Props {
  results: ReviewResult[]
  selectedCopies?: SelectedCopy[]
  /** 보정된 카피를 부모에 전달 (store 반영용). */
  onCopyCorrected?: (copyKey: string, corrected: CopyItem) => void
  /**
   * 보정된 카피에 대해 스킬 재평가를 요청.
   * 부모(EditorPage)가 review API를 호출하고, 새 결과를 반환해야 함.
   */
  onReReview?: (
    copyKey: string,
    correctedCopyData: CopyItem,
    skillIds: string[],
  ) => Promise<ReviewResult[]>
  /** 저장 및 종료 버튼 클릭 시 호출. */
  onSaveAndFinish?: () => void
}

export function ReviewResults({
  results: initialResults,
  selectedCopies = [],
  onCopyCorrected,
  onReReview,
  onSaveAndFinish,
}: Props) {
  // 로컬 결과 — 재평가 시 특정 카피의 결과만 교체됨
  const [localResults, setLocalResults] = useState<ReviewResult[]>(initialResults)

  // props가 바뀌면(외부 전체 리뷰 재실행 등) 동기화
  useEffect(() => {
    setLocalResults(initialResults)
    setConsumed(new Map())
    setCorrections(new Map())
    setChecked(new Map())
    setReReviewing(null)
  }, [initialResults])

  const grouped = useMemo(() => {
    const map = new Map<string, ReviewResult[]>()
    for (const r of localResults) {
      const key = r.targetCopyKey
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    return map
  }, [localResults])

  const copyKeys = useMemo(() => [...grouped.keys()], [grouped])
  const [activeKey, setActiveKey] = useState<string>(copyKeys[0] ?? '')
  const currentKey = grouped.has(activeKey) ? activeKey : copyKeys[0] ?? ''

  // 체크 상태: Map<copyKey, Set<"skillId::index">>
  const [checked, setChecked] = useState<Map<string, Set<string>>>(new Map())
  // 이미 보정에 사용되어 제거된 improvement ID: Map<copyKey, Set<"skillId::index">>
  const [consumed, setConsumed] = useState<Map<string, Set<string>>>(new Map())
  // 보정 결과: Map<copyKey, CorrectionResponse>
  const [corrections, setCorrections] = useState<Map<string, CorrectionResponse>>(new Map())
  // 재평가 진행 중인 copyKey
  const [reReviewing, setReReviewing] = useState<string | null>(null)

  const correctCopy = useCorrectCopy()

  const summary = useMemo(() => {
    const total = localResults.length
    const passed = localResults.filter((r) => r.passed).length
    const failed = total - passed
    const avg = total
      ? localResults.reduce((sum, r) => sum + r.score, 0) / total
      : 0
    return { total, passed, failed, avg }
  }, [localResults])

  const currentCopy = selectedCopies.find((c) => c.key === currentKey)
  const currentResults = grouped.get(currentKey) ?? []
  const currentCorrection = corrections.get(currentKey)

  const toggleImprovement = (copyKey: string, id: string) => {
    setChecked((prev) => {
      const next = new Map(prev)
      const set = new Set(next.get(copyKey) ?? [])
      if (set.has(id)) set.delete(id)
      else set.add(id)
      next.set(copyKey, set)
      return next
    })
  }

  /** 특정 카피+스킬의 improvement 중 consumed되지 않은 것만 반환 */
  const getVisibleImprovements = useCallback(
    (copyKey: string, skillId: string, items: string[]) => {
      const consumedSet = consumed.get(copyKey)
      if (!consumedSet) return items.map((text, idx) => ({ text, idx }))
      return items
        .map((text, idx) => ({ text, idx }))
        .filter(({ idx }) => !consumedSet.has(`${skillId}::${idx}`))
    },
    [consumed],
  )

  const selectedCount = (checked.get(currentKey) ?? new Set()).size

  /** 보정 + 소비 + 재평가 */
  const handleCorrect = async () => {
    if (!currentCopy) return
    const checkedSet = checked.get(currentKey)
    if (!checkedSet || checkedSet.size === 0) return

    // 선택된 improvements 수집
    const improvements: Array<{ skillId: string; text: string }> = []
    for (const r of grouped.get(currentKey) ?? []) {
      r.improvements.forEach((text, idx) => {
        if (checkedSet.has(`${r.skillId}::${idx}`)) {
          improvements.push({ skillId: r.skillId, text })
        }
      })
    }
    if (improvements.length === 0) return

    try {
      // 1. 카피 보정
      const corrected = await correctCopy.mutateAsync({
        copyKey: currentKey,
        copyData: currentCopy.copyData,
        improvements,
      })
      setCorrections((prev) => new Map(prev).set(currentKey, corrected))
      onCopyCorrected?.(currentKey, corrected)

      // 2. 사용한 improvements를 consumed로 이동 + 체크 해제
      setConsumed((prev) => {
        const next = new Map(prev)
        const existing = new Set(next.get(currentKey) ?? [])
        for (const id of checkedSet) existing.add(id)
        next.set(currentKey, existing)
        return next
      })
      setChecked((prev) => {
        const next = new Map(prev)
        next.delete(currentKey)
        return next
      })

      // 3. 보정된 카피로 스킬 재평가
      if (onReReview) {
        const skillIds = [
          ...new Set((grouped.get(currentKey) ?? []).map((r) => r.skillId)),
        ]
        setReReviewing(currentKey)
        try {
          const newResults = await onReReview(currentKey, corrected, skillIds)
          if (newResults.length > 0) {
            // 해당 copyKey의 결과만 교체
            setLocalResults((prev) => [
              ...prev.filter((r) => r.targetCopyKey !== currentKey),
              ...newResults,
            ])
            // 새 결과에 대한 consumed/checked 초기화
            setConsumed((prev) => {
              const next = new Map(prev)
              next.delete(currentKey)
              return next
            })
          }
        } finally {
          setReReviewing(null)
        }
      }
    } catch (err) {
      console.error('[ReviewResults] correct failed', err)
      alert('카피 보정에 실패했습니다.')
    }
  }

  const isBusy =
    correctCopy.isPending || reReviewing === currentKey

  if (localResults.length === 0) {
    return (
      <Card>
        <p style={{ fontSize: 13, color: 'var(--neutral-500)' }}>
          리뷰 결과가 없습니다.
        </p>
      </Card>
    )
  }

  return (
    <Card style={{ padding: '1.2rem' }}>
      {/* 헤더 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: 'var(--neutral-900)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ color: 'var(--lg-red-600)' }}>⚖</span>
          Review Results
        </h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge tone="neutral">Avg {summary.avg.toFixed(1)}</Badge>
          <Badge tone="success">Pass {summary.passed}</Badge>
          <Badge tone="danger">Fail {summary.failed}</Badge>
          <Badge tone="primary">Total {summary.total}</Badge>
        </div>
      </div>

      {/* 카피별 탭 */}
      <div style={tabBarStyle}>
        {copyKeys.map((key) => {
          const copy = selectedCopies.find((c) => c.key === key)
          const meta = copy ? countryMeta(copy.countryCode) : null
          const keyResults = grouped.get(key) ?? []
          const allPass = keyResults.every((r) => r.passed)
          const hasCorrected = corrections.has(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              style={tabBtnStyle(currentKey === key)}
            >
              {meta && <span>{meta.flag}</span>}
              <span>{key}</span>
              <Badge
                tone={hasCorrected ? 'primary' : allPass ? 'success' : 'danger'}
                style={{ fontSize: 10 }}
              >
                {hasCorrected ? '보정됨' : allPass ? 'P' : 'F'}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* 재평가 진행 중 */}
      {reReviewing === currentKey && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'var(--lg-red-100)',
            border: '1px solid var(--lg-red-600)',
            marginBottom: 14,
          }}
        >
          <Spinner />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--lg-red-700)', margin: 0 }}>
            보정된 카피로 스킬 재평가 중…
          </p>
        </div>
      )}

      {/* 카피 원문 / Before-After */}
      {currentCopy && (
        <div style={copyCardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Badge tone="primary">
              {countryMeta(currentCopy.countryCode).flag}{' '}
              {countryMeta(currentCopy.countryCode).label}
            </Badge>
            <span style={monoSmall}>{currentCopy.key}</span>
            {currentCorrection && <Badge tone="success">보정 완료</Badge>}
          </div>

          {currentCorrection ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: 0,
              }}
            >
              <div style={{ paddingRight: 16 }}>
                <p style={{ ...fieldLabelStyle, color: 'var(--neutral-500)' }}>
                  Before
                </p>
                <CopyBlock copy={currentCopy.copyData} />
              </div>
              <div
                style={{
                  width: 1,
                  background: 'var(--color-border)',
                  alignSelf: 'stretch',
                }}
              />
              <div style={{ paddingLeft: 16 }}>
                <p style={{ ...fieldLabelStyle, color: 'var(--lg-red-700)' }}>
                  After (보정)
                </p>
                <CopyBlock copy={currentCorrection} />
              </div>
            </div>
          ) : (
            <CopyBlock copy={currentCopy.copyData} />
          )}
        </div>
      )}

      {/* 스킬별 리뷰 결과 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {currentResults.map((r, i) => {
          const visible = getVisibleImprovements(currentKey, r.skillId, r.improvements)
          return (
            <div key={`${r.skillId}-${i}`} style={skillCardStyle}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Badge tone={r.passed ? 'success' : 'danger'}>
                  {r.passed ? 'PASS' : 'FAIL'}
                </Badge>
                <strong style={{ fontSize: 13, color: 'var(--neutral-900)' }}>
                  {r.skillId}
                </strong>
                <span style={{ fontSize: 11, color: 'var(--neutral-500)' }}>
                  {r.skillType}
                </span>
                <div style={{ flex: 1 }} />
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: r.passed ? 'var(--success)' : 'var(--lg-red-600)',
                  }}
                >
                  {r.score}
                </span>
                {typeof r.executionMs === 'number' && (
                  <span style={{ fontSize: 11, color: 'var(--neutral-500)' }}>
                    {r.executionMs}ms
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    r.strengths.length && (r.weaknesses.length || visible.length)
                      ? '1fr 1fr 1fr'
                      : '1fr',
                  gap: 12,
                }}
              >
                {r.strengths.length > 0 && (
                  <BulletBlock label="Strengths" items={r.strengths} color="var(--success)" />
                )}
                {r.weaknesses.length > 0 && (
                  <BulletBlock label="Weaknesses" items={r.weaknesses} color="var(--danger)" />
                )}
                {visible.length > 0 && (
                  <ImprovementsBlock
                    skillId={r.skillId}
                    items={visible}
                    checkedSet={checked.get(currentKey) ?? new Set()}
                    onToggle={(id) => toggleImprovement(currentKey, id)}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Correct 버튼 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        {selectedCount > 0 && (
          <span style={{ fontSize: 13, color: 'var(--neutral-700)' }}>
            {selectedCount}개 개선안 선택됨
          </span>
        )}
        <Button
          onClick={handleCorrect}
          disabled={selectedCount === 0 || isBusy || !currentCopy}
        >
          {correctCopy.isPending
            ? '보정 중…'
            : reReviewing === currentKey
              ? '재평가 중…'
              : '선택한 개선안으로 카피 보정'}
        </Button>
        {onSaveAndFinish && (
          <Button onClick={onSaveAndFinish} disabled={isBusy}>
            저장 및 종료
          </Button>
        )}
      </div>
    </Card>
  )
}

/* ── Internal ── */

function Spinner() {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        border: '2.5px solid var(--neutral-200)',
        borderTopColor: 'var(--lg-red-600)',
        borderRadius: '50%',
        animation: 'rr-spin 0.8s linear infinite',
        flexShrink: 0,
      }}
    >
      <style>{`@keyframes rr-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function CopyBlock({
  copy,
}: {
  copy: Pick<CopyItem, 'headline' | 'subheadline' | 'bodyCopy' | 'cta'>
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {copy.headline && (
        <div>
          <p style={fieldLabelStyle}>Headline</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--neutral-900)', lineHeight: 1.5 }}>{copy.headline}</p>
        </div>
      )}
      {copy.subheadline && (
        <div>
          <p style={fieldLabelStyle}>Subheadline</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--neutral-900)', lineHeight: 1.5 }}>{copy.subheadline}</p>
        </div>
      )}
      {copy.bodyCopy && (
        <div>
          <p style={fieldLabelStyle}>Body Copy</p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--neutral-900)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{copy.bodyCopy}</p>
        </div>
      )}
      {copy.cta && (
        <div>
          <p style={fieldLabelStyle}>CTA</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--neutral-900)' }}>{copy.cta}</p>
        </div>
      )}
    </div>
  )
}

function ImprovementsBlock({
  skillId,
  items,
  checkedSet,
  onToggle,
}: {
  skillId: string
  items: Array<{ text: string; idx: number }>
  checkedSet: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--lg-red-700)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
        Improvements
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(({ text, idx }) => {
          const id = `${skillId}::${idx}`
          const isChecked = checkedSet.has(id)
          return (
            <label
              key={id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 6,
                background: isChecked ? 'var(--lg-red-100)' : 'transparent',
                transition: 'background 0.15s ease',
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(id)}
                style={{ accentColor: 'var(--lg-red-600)', marginTop: 3, flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: 'var(--neutral-700)', lineHeight: 1.6 }}>
                {text}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

function BulletBlock({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</p>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {items.map((it, i) => (
          <li key={i} style={{ fontSize: 13, color: 'var(--neutral-700)', lineHeight: 1.6 }}>{it}</li>
        ))}
      </ul>
    </div>
  )
}

/* ── Styles ── */

const tabBarStyle: CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--color-border)', paddingBottom: 0, marginBottom: 14 }

const tabBtnStyle = (active: boolean): CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  background: 'none', color: active ? 'var(--lg-red-700)' : 'var(--neutral-500)',
  borderBottom: active ? '2px solid var(--lg-red-600)' : '2px solid transparent',
  marginBottom: -1, transition: 'color 0.15s ease',
})

const copyCardStyle: CSSProperties = { background: 'var(--neutral-100)', borderRadius: 12, padding: '14px 16px', marginBottom: 14, border: '1px solid var(--color-border)' }
const skillCardStyle: CSSProperties = { background: 'var(--white)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(17, 17, 17, 0.04)' }
const fieldLabelStyle: CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }
const monoSmall: CSSProperties = { fontSize: 12, color: 'var(--neutral-500)', fontFamily: 'JetBrains Mono, monospace' }
