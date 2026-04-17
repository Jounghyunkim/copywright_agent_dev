import { CSSProperties, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { FieldLabel, TextInput, TextArea } from '@/shared/ui/field'
import { StepIndicator } from '@/shared/ui/step-indicator'
import { SplitPane } from '@/shared/ui/split-pane'
import { ReviewConfig, ReviewResults } from '@/features/review'
import { CopyResults, COUNTRIES } from '@/features/copy-generation'
import { ChatPanel } from '@/features/chat'
import type { ChatPanelHandle } from '@/features/chat'

import {
  useCampaign,
  useRunReviewSSE,
  useSaveCampaign,
  useSkills,
  useUpdateCampaign,
} from '@/shared/api/hooks'
import type {
  CopyItem,
  CopyResult,
  ReviewResult,
  ReviewSummary,
  SelectedCopy,
} from '@/shared/api/types'

const STEPS = [
  { step: 1, label: '카피 입력' },
  { step: 2, label: '검토' },
]

interface CopyEntry {
  id: string
  countryCode: string
  headline: string
  subheadline: string
  bodyCopy: string
  cta: string
  methodology: string
  culturalNotes: string
  toneAnalysis: string
}

const EMPTY_ENTRY: Omit<CopyEntry, 'id'> = {
  countryCode: 'US',
  headline: '',
  subheadline: '',
  bodyCopy: '',
  cta: '',
  methodology: '',
  culturalNotes: '',
  toneAnalysis: '',
}

let entrySeq = 0
function newEntry(): CopyEntry {
  return { ...EMPTY_ENTRY, id: `entry-${++entrySeq}` }
}

/** 첫 번째 카피의 headline/bodyCopy로 brief를 동적 생성 */
function buildReviewBrief(copies: CopyResult[]) {
  const first = copies[0]?.copies?.[0]
  return {
    projectName: first?.headline || '카피라이트 검토',
    date: new Date().toISOString().slice(0, 10),
    projectContext: first?.bodyCopy || '사용자가 직접 입력한 카피에 대한 스킬 기반 검토',
    objectiveCommercial: '',
    objectiveBehavior: '',
    objectiveAttitudinal: '',
    audience: '',
    keyMessage: '',
    proofPoints: '',
    mandatories: '',
    budget: '',
    marketNeeds: '',
    timing: '',
  }
}

/** 카피라이트 검토 전용 최소 analysis/strategy (리뷰 API context 용) */
const REVIEW_ONLY_ANALYSIS = {
  briefSummary: { objective: '', coreChallenge: '', aiDirection: '' },
  persona: { name: '' },
  brandFit: { score: 0 },
  marketAnalysis: { opportunityGap: '', riskKeyword: '' },
  competitiveKeywords: [],
  categoryNarrative: {},
  emotionalJTBD: '',
  culturalTension: {},
  copyImplications: {},
  recommendedKeywords: [],
}

const REVIEW_ONLY_STRATEGY = {
  coreMessage: '',
  messagePillars: [],
  emotionalHook: '',
  toneDirection: '',
  keyPhrases: [],
}

export function CopyReviewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  /* ── URL ?campaignId=xxx → 기존 저장 캠페인 로드 ── */
  const urlCampaignId = searchParams.get('campaignId')

  const chatRef = useRef<ChatPanelHandle>(null)
  const [entries, setEntries] = useState<CopyEntry[]>([newEntry()])
  const [phase, setPhase] = useState<'input' | 'review'>('input')
  const [reviewCompleted, setReviewCompleted] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const runReview = useRunReviewSSE()
  const skillsQuery = useSkills()
  const saveCampaign = useSaveCampaign()
  const updateCampaign = useUpdateCampaign()

  /** 현재 페이지에서 관리하는 캠페인 ID (로드 또는 첫 저장 시 설정) */
  const [localCampaignId, setLocalCampaignId] = useState<string | null>(
    urlCampaignId,
  )

  const [localReviewResults, setLocalReviewResults] = useState<
    ReviewResult[] | null
  >(null)
  const [localSelectedCopies, setLocalSelectedCopies] = useState<
    SelectedCopy[]
  >([])
  const [localCopyResults, setLocalCopyResults] = useState<CopyResult[]>([])
  const loadedCampaign = useCampaign(urlCampaignId && !loaded ? urlCampaignId : null)

  useEffect(() => {
    if (!loadedCampaign.data || loaded) return
    const d = loadedCampaign.data

    // copyResults가 있으면 review phase로 바로 이동
    if (d.copyResults && d.copyResults.length > 0) {
      setLocalCopyResults(d.copyResults)

      const selected: SelectedCopy[] = []
      for (const cr of d.copyResults) {
        cr.copies.forEach((copy: CopyItem, idx: number) => {
          selected.push({
            key: `${cr.countryCode}-${idx}`,
            countryCode: cr.countryCode,
            copyData: copy,
          })
        })
      }
      setLocalSelectedCopies(selected)
      setPhase('review')

      // reviewResults도 있으면 복원
      if (d.reviewResults && d.reviewResults.length > 0) {
        setLocalReviewResults(d.reviewResults)
      }
    }
    setLoaded(true)
  }, [loadedCampaign.data, loaded])

  /* ── Entry CRUD ── */

  const updateEntry = (id: string, patch: Partial<CopyEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    )
  }

  const removeEntry = (id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id)
      return next.length === 0 ? [newEntry()] : next
    })
  }

  const addEntry = () => setEntries((prev) => [...prev, newEntry()])

  const isEntryValid = (e: CopyEntry) =>
    e.countryCode.trim() !== '' &&
    e.headline.trim() !== '' &&
    e.subheadline.trim() !== '' &&
    e.bodyCopy.trim() !== '' &&
    e.cta.trim() !== ''

  const allValid = entries.every(isEntryValid)

  /* ── Confirm ── */

  const handleConfirm = () => {
    if (!allValid) return

    const byCountry = new Map<string, CopyItem[]>()
    for (const e of entries) {
      if (!byCountry.has(e.countryCode)) byCountry.set(e.countryCode, [])
      byCountry.get(e.countryCode)!.push({
        headline: e.headline,
        subheadline: e.subheadline,
        bodyCopy: e.bodyCopy,
        cta: e.cta,
        methodology: e.methodology || undefined,
        culturalNotes: e.culturalNotes || undefined,
        toneAnalysis: e.toneAnalysis || undefined,
      })
    }

    const copyResults: CopyResult[] = [...byCountry.entries()].map(
      ([countryCode, copies]) => ({ countryCode, copies }),
    )
    setLocalCopyResults(copyResults)

    const selected: SelectedCopy[] = []
    for (const cr of copyResults) {
      cr.copies.forEach((copy, idx) => {
        selected.push({
          key: `${cr.countryCode}-${idx}`,
          countryCode: cr.countryCode,
          copyData: copy,
        })
      })
    }
    setLocalSelectedCopies(selected)
    setPhase('review')
  }

  /* ── Review (독립적 — 글로벌 store 미사용) ── */

  const handleRunReview = async (enabledSkillIds: string[]) => {
    if (localSelectedCopies.length === 0 || enabledSkillIds.length === 0) return
    const results = await runReview.run({
      brief: buildReviewBrief(localCopyResults),
      analysisReport: REVIEW_ONLY_ANALYSIS as never,
      strategicMessage: REVIEW_ONLY_STRATEGY as never,
      selectedCopies: localSelectedCopies,
      enabledSkills: enabledSkillIds,
    })
    if (results.length > 0) {
      setLocalReviewResults(results)
    }
  }

  const handleReReview = async (
    copyKey: string,
    correctedCopyData: CopyItem,
    skillIds: string[],
  ): Promise<ReviewResult[]> => {
    const copy = localSelectedCopies.find((c) => c.key === copyKey)
    if (!copy) return []
    return await runReview.run({
      brief: buildReviewBrief(localCopyResults),
      analysisReport: REVIEW_ONLY_ANALYSIS as never,
      strategicMessage: REVIEW_ONLY_STRATEGY as never,
      selectedCopies: [
        { key: copy.key, countryCode: copy.countryCode, copyData: correctedCopyData },
      ],
      enabledSkills: skillIds,
    })
  }

  const reviewSummary: ReviewSummary | null =
    localReviewResults && localReviewResults.length > 0
      ? {
          avgScore:
            Math.round(
              (localReviewResults.reduce((s, r) => s + r.score, 0) /
                localReviewResults.length) *
                10,
            ) / 10,
          passed: localReviewResults.filter((r) => r.passed).length,
          failed: localReviewResults.filter((r) => !r.passed).length,
          total: localReviewResults.length,
        }
      : null

  const handleSaveAndFinish = async () => {
    setReviewCompleted(true)
    const body = {
      brief: buildReviewBrief(localCopyResults),
      copyResults: localCopyResults,
      reviewSummary,
      reviewResults: localReviewResults,
      currentStep: 5,
    }
    try {
      if (localCampaignId) {
        await updateCampaign.mutateAsync({ id: localCampaignId, body })
      } else {
        const res = await saveCampaign.mutateAsync(body)
        setLocalCampaignId(res.id)
      }
    } catch (err) {
      console.error('[CopyReviewPage] save failed', err)
      alert('저장에 실패했습니다.')
    }
    navigate('/')
  }

  /* ── Left pane ── */

  const renderLeftPane = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Phase: input */}
      {phase === 'input' && (
        <>
          {entries.map((entry, idx) => (
            <Card key={entry.id} style={{ padding: '1.2rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>카피 #{idx + 1}</h3>
                {entries.length > 1 && (
                  <Button variant="ghost" className="btn-compact" onClick={() => removeEntry(entry.id)}>
                    삭제
                  </Button>
                )}
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <FieldLabel>국가 <span style={{ color: 'var(--lg-red-600)' }}>*</span><HelpTip label="국가" text="카피가 게재될 대상 국가를 선택하세요. 국가에 따라 언어와 문화적 맥락이 달라집니다." chatRef={chatRef} /></FieldLabel>
                  <select className="select" value={entry.countryCode} onChange={(e) => updateEntry(entry.id, { countryCode: e.target.value })}>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.label} ({c.lang})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <FieldLabel>Headline <span style={{ color: 'var(--lg-red-600)' }}>*</span><HelpTip label="Headline" text="광고의 첫 인상을 결정하는 메인 문구입니다. 짧고 강렬하게 핵심 메시지를 전달하세요." chatRef={chatRef} /></FieldLabel>
                    <TextInput value={entry.headline} onChange={(e) => updateEntry(entry.id, { headline: e.target.value })} placeholder="메인 헤드라인" />
                  </div>
                  <div>
                    <FieldLabel>Subheadline <span style={{ color: 'var(--lg-red-600)' }}>*</span><HelpTip label="Subheadline" text="헤드라인을 보충하는 보조 문구입니다. 추가 설명이나 맥락을 제공합니다." chatRef={chatRef} /></FieldLabel>
                    <TextInput value={entry.subheadline} onChange={(e) => updateEntry(entry.id, { subheadline: e.target.value })} placeholder="보조 헤드라인" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Body Copy <span style={{ color: 'var(--lg-red-600)' }}>*</span><HelpTip label="Body Copy" text="제품이나 캠페인의 상세 내용을 전달하는 본문입니다. 타겟 고객의 관심을 끄는 핵심 정보를 담으세요." chatRef={chatRef} /></FieldLabel>
                  <TextArea value={entry.bodyCopy} onChange={(e) => updateEntry(entry.id, { bodyCopy: e.target.value })} placeholder="본문 카피" style={{ minHeight: 100 }} />
                </div>
                <div>
                  <FieldLabel>CTA <span style={{ color: 'var(--lg-red-600)' }}>*</span><HelpTip label="CTA" text="사용자의 행동을 유도하는 문구입니다. 예: '지금 구매하기', 'Learn More' 등" chatRef={chatRef} /></FieldLabel>
                  <TextInput value={entry.cta} onChange={(e) => updateEntry(entry.id, { cta: e.target.value })} placeholder="Call to Action" />
                </div>
                <details style={{ marginTop: 4 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--neutral-500)', fontWeight: 600 }}>
                    선택 항목 (Methodology / Cultural Notes / Tone Analysis)
                  </summary>
                  <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                    <div><FieldLabel>Methodology<HelpTip label="Methodology" text="카피를 작성할 때 사용한 방법론이나 전략입니다. 예: AIDA, PAS, 스토리텔링 등" chatRef={chatRef} /></FieldLabel><TextInput value={entry.methodology} onChange={(e) => updateEntry(entry.id, { methodology: e.target.value })} placeholder="카피 작성 방법론 (선택)" /></div>
                    <div><FieldLabel>Cultural Notes<HelpTip label="Cultural Notes" text="해당 국가나 문화권에서 특별히 고려한 사항입니다. 현지 관습, 금기, 언어적 뉘앙스 등" chatRef={chatRef} /></FieldLabel><TextInput value={entry.culturalNotes} onChange={(e) => updateEntry(entry.id, { culturalNotes: e.target.value })} placeholder="문화적 고려사항 (선택)" /></div>
                    <div><FieldLabel>Tone Analysis<HelpTip label="Tone Analysis" text="카피의 전체적인 톤과 분위기를 설명합니다. 예: 격식체, 유머러스, 감성적, 전문적 등" chatRef={chatRef} /></FieldLabel><TextInput value={entry.toneAnalysis} onChange={(e) => updateEntry(entry.id, { toneAnalysis: e.target.value })} placeholder="톤 분석 (선택)" /></div>
                  </div>
                </details>
              </div>
            </Card>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="ghost" onClick={addEntry}>+ 카피 추가</Button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge tone="neutral">{entries.length}개 카피</Badge>
              <Button onClick={handleConfirm} disabled={!allValid}>입력 완료</Button>
            </div>
          </div>
        </>
      )}

      {/* Phase: review */}
      {phase === 'review' && (
        <>
          <CopyResults results={localCopyResults} readOnly />

          {!localReviewResults && (
            <ReviewConfig
              selectedCopies={localSelectedCopies}
              skills={skillsQuery.data ?? []}
              isLoadingSkills={skillsQuery.isLoading}
              isReviewing={runReview.isPending}
              onRunReview={handleRunReview}
            />
          )}

          {runReview.isPending && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={spinnerStyle} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--neutral-900)' }}>스킬 기반 리뷰 실행 중…</p>
              </div>
              {runReview.progressMessages.length > 0 && (
                <div style={logBoxStyle}>
                  {runReview.progressMessages.map((msg, i) => (<p key={i} style={logLineStyle}>{msg}</p>))}
                </div>
              )}
            </Card>
          )}

          {localReviewResults && (
            <ReviewResults
              results={localReviewResults}
              selectedCopies={localSelectedCopies}
              onReReview={handleReReview}
              onSaveAndFinish={handleSaveAndFinish}
            />
          )}
        </>
      )}
    </div>
  )

  /* ── Layout ── */

  return (
    <div style={pageWrap}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <h2 className="page-title">카피라이트 검토</h2>
          <p className="page-subtitle">
            왼쪽에서 카피를 입력 · 리뷰 결과를 확인하고, 오른쪽 채팅으로
            AI 어시스턴트와 대화하세요.
          </p>
        </div>
      </div>

      <Card style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '0.65rem 1rem', flexWrap: 'wrap' }}>
        {STEPS.map((s, idx) => (
          <span key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <StepIndicator
              step={s.step}
              label={s.label}
              active={(s.step === 1 && phase === 'input') || (s.step === 2 && phase === 'review' && !reviewCompleted)}
              done={(s.step === 1 && phase === 'review') || (s.step === 2 && reviewCompleted)}
            />
            {idx < STEPS.length - 1 && <span style={{ color: 'var(--neutral-500)' }}>&rarr;</span>}
          </span>
        ))}
      </Card>

      <div style={splitWrap}>
        <SplitPane
          storageKey="copylight-v2:copy-review-split"
          defaultRatio={0.8}
          minLeftPx={520}
          minRightPx={220}
          left={<div style={{ height: '100%', minHeight: 0, overflow: 'auto', paddingRight: 4 }}>{renderLeftPane()}</div>}
          right={
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
                AI 어시스턴트
              </h4>
              <div style={{ flex: 1, minHeight: 0 }}><ChatPanel ref={chatRef} /></div>
            </Card>
          }
        />
      </div>
      <style>{`@keyframes cr-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

/* ── HelpTip ── */

function HelpTip({ label, text, chatRef }: { label: string; text: string; chatRef: React.RefObject<ChatPanelHandle | null> }) {
  const handleClick = () => {
    chatRef.current?.addAssistantMessage(
      `**${label} 항목 안내**\n${text}`,
    )
  }
  return (
    <span
      onClick={handleClick}
      title="클릭하면 AI 어시스턴트가 설명합니다"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: 'var(--neutral-200)',
        color: 'var(--neutral-600)',
        fontSize: 10,
        fontWeight: 700,
        cursor: 'pointer',
        lineHeight: 1,
        userSelect: 'none',
        marginLeft: 4,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--lg-red-100)'; e.currentTarget.style.color = 'var(--lg-red-600)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--neutral-200)'; e.currentTarget.style.color = 'var(--neutral-600)' }}
    >
      ?
    </span>
  )
}

const pageWrap: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, height: 'calc(100vh - 64px - 2.4rem)', minHeight: 600 }
const splitWrap: CSSProperties = { flex: 1, minHeight: 0, border: '1px solid var(--color-border)', borderRadius: 14, background: 'var(--white)', padding: 12, boxShadow: '0 8px 24px rgba(17, 17, 17, 0.04), 0 1px 2px rgba(17, 17, 17, 0.04)' }
const spinnerStyle: CSSProperties = { width: 24, height: 24, border: '3px solid var(--neutral-200)', borderTopColor: 'var(--lg-red-600)', borderRadius: '50%', animation: 'cr-spin 0.8s linear infinite', flexShrink: 0 }
const logBoxStyle: CSSProperties = { background: 'var(--neutral-100)', borderRadius: 8, padding: '10px 12px', maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }
const logLineStyle: CSSProperties = { fontSize: 12, color: 'var(--neutral-700)', fontFamily: 'JetBrains Mono, monospace', margin: 0, lineHeight: 1.5 }
