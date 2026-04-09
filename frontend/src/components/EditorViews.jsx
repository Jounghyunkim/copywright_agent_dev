import React, { useState } from 'react';
import { Bot, Zap, Cpu, ArrowRight, Loader, Globe, CheckCircle, XCircle, AlertTriangle, Lock, Pencil, Trash2, Save, LogOut, FileText as FileTextIcon, Search as SearchIcon, MessageSquareText as MsgIcon, ClipboardCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { COLORS } from '../styles/theme';
import AnalysisReport from './AnalysisReport';
import StrategicMessage from './StrategicMessage';
import GenerationConfig from './GenerationConfig';
import CopyResults from './CopyResults';
import { useT } from '../shared/i18n/useTranslation';

// 아바타 키워드 → 이모지 매핑
const AVATAR_EMOJI = {
    'exclamation': '🔥', 'glasses': '🔬', 'wink': '😄', 'beret': '🎨',
    'pen': '✒️', 'crown': '👑', 'star': '⭐', 'book': '📖',
    'clock': '⏰', 'lightning': '⚡',
};
const resolveAvatar = (a) => {
    if (!a) return '✍️';
    if (/\p{Emoji}/u.test(a) && a.length <= 4) return a;
    return AVATAR_EMOJI[a.toLowerCase()] || '✍️';
};

function useWorkflowSteps() {
  const t = useT();
  return [
    { num: 1, label: t('step.research'), icon: FileTextIcon, color: COLORS.LG_RED, active: true, title: t('wf.step1.title'), desc: t('wf.step1.desc') },
    { num: 2, label: t('step.analysis'), icon: SearchIcon, color: '#2563EB', title: 'Market Analyst Report', desc: t('wf.step2.desc') },
    { num: 3, label: t('step.strategicMessage'), icon: MsgIcon, color: '#7C3AED', title: t('wf.step3.title'), desc: t('wf.step3.desc') },
    { num: 4, label: t('step.generation'), icon: Zap, color: '#D97706', title: t('wf.step4.title'), desc: t('wf.step4.desc') },
    { num: 5, label: t('step.review'), icon: ClipboardCheck, color: '#059669', title: t('wf.step5.title'), desc: t('wf.step5.desc') },
  ];
}

const InitialView = () => {
  const t = useT();
  const WORKFLOW_STEPS = useWorkflowSteps();
  return (
  <>
    {/* Greeting */}
    <div style={{ display: 'flex', gap: '16px', maxWidth: '85%' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '14px', backgroundColor: COLORS.LG_RED,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.WHITE,
        boxShadow: '0 4px 10px rgba(165, 0, 52, 0.2)', flexShrink: 0,
      }}>
        <Bot size={22} />
      </div>
      <div>
        <div style={{
          padding: '1.2rem 1.5rem', borderRadius: '20px', borderTopLeftRadius: '4px',
          backgroundColor: COLORS.WHITE, boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
          lineHeight: 1.7, fontSize: '1rem',
        }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '1.05rem' }}>
            {t('chat.greeting')}
          </p>
          <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
            {t('chat.greetingDesc')}
          </p>
        </div>
      </div>
    </div>

    {/* 워크플로우 가이드 카드 */}
    <div style={{
      padding: '1.5rem', borderRadius: '20px',
      backgroundColor: COLORS.WHITE, boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
      border: `1px solid ${COLORS.BORDER}`,
    }}>
      <h4 style={{
        margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 800, color: COLORS.TEXT_MAIN,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <Zap size={18} color={COLORS.LG_RED} /> Workflow Guide
      </h4>
      <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: COLORS.TEXT_SUB }}>
        {t('chat.workflowGuide')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {WORKFLOW_STEPS.map((s, i) => {
          const Icon = s.icon;
          const isFirst = s.active;
          return (
            <div key={s.num} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              {/* Step 번호 + 연결선 */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                width: '36px', flexShrink: 0,
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  backgroundColor: isFirst ? s.color : `${s.color}14`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isFirst ? `0 4px 12px ${s.color}40` : 'none',
                  transition: 'all 0.2s',
                }}>
                  <Icon size={16} color={isFirst ? COLORS.WHITE : s.color} />
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div style={{
                    width: '2px', height: '100%', minHeight: '12px',
                    backgroundColor: COLORS.BORDER, marginTop: '4px',
                  }} />
                )}
              </div>

              {/* 텍스트 */}
              <div style={{ flex: 1, paddingBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '1px 7px', borderRadius: '5px',
                    backgroundColor: isFirst ? s.color : `${s.color}14`,
                    color: isFirst ? COLORS.WHITE : s.color,
                  }}>
                    Step {s.num}
                  </span>
                  <span style={{
                    fontSize: '0.88rem', fontWeight: 700,
                    color: isFirst ? s.color : COLORS.TEXT_MAIN,
                  }}>
                    {s.label}
                  </span>
                </div>
                <div style={{
                  margin: '2px 0 0', fontSize: '0.8rem', lineHeight: 1.6,
                  color: isFirst ? COLORS.TEXT_MAIN : COLORS.TEXT_SUB,
                  whiteSpace: 'pre-line',
                }}>
                  <strong style={{ color: isFirst ? s.color : COLORS.TEXT_MAIN }}>{s.title}</strong>
                  {' — '}{s.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* 시작 안내 */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '14px 20px', borderRadius: '14px',
      background: `linear-gradient(135deg, ${COLORS.LG_RED}08 0%, ${COLORS.LG_RED}15 100%)`,
      border: `1.5px solid ${COLORS.LG_RED}30`,
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        backgroundColor: COLORS.LG_RED, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <ArrowRight size={16} color={COLORS.WHITE} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: COLORS.LG_RED }}>
          {t('chat.startInstruction')}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: COLORS.TEXT_SUB }}>
          {t('chat.startDetail')}
        </p>
      </div>
    </div>
  </>
  );
};

const ResultView = ({ onApprove, onModify, isApproved, analysisResult }) => (
    <div style={{ display: 'flex', gap: '16px', maxWidth: '100%' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '14px', backgroundColor: COLORS.LG_RED,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.WHITE,
        boxShadow: '0 4px 10px rgba(165, 0, 52, 0.2)', flexShrink: 0
      }}>
        <Bot size={22} />
      </div>
      <div style={{flex: 1}}>
        <div style={{
          padding: '1.2rem 1.5rem', borderRadius: '20px', borderTopLeftRadius: '4px',
          backgroundColor: COLORS.WHITE, boxShadow: `0 4px 15px ${'rgba(0, 0, 0, 0.08)'}`,
          lineHeight: 1.6, fontSize: '1rem'
        }}>
          <p style={{ margin: 0, fontWeight: 500 }}>브리핑을 접수했습니다, 정현님! 🚀</p>
          <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
            **Market Analyst Agent**가 RAG 기반으로 타겟 시장을 분석하여 핵심 인사이트를 도출했습니다.
            아래 리포트를 검토하시고 다음 단계를 승인해주세요.
          </p>
        </div>
        <AnalysisReport
          onApprove={onApprove}
          onModify={onModify}
          isApproved={isApproved}
          analysisResult={analysisResult}
        />
      </div>
    </div>
);

const StrategicMessageView = ({ strategicData, isStrategicLoading, isStrategicApproved, onModifyStrategic, onApproveStrategic, onUpdateStrategic }) => {
    const t = useT();
    return (
    <div style={{ display: 'flex', gap: '16px', maxWidth: '100%' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '14px', backgroundColor: COLORS.LG_RED,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.WHITE,
        boxShadow: '0 4px 10px rgba(165, 0, 52, 0.2)', flexShrink: 0
      }}>
        <Bot size={22} />
      </div>
      <div style={{flex: 1}}>
        <div style={{
          padding: '1.2rem 1.5rem', borderRadius: '20px', borderTopLeftRadius: '4px',
          backgroundColor: COLORS.WHITE, boxShadow: `0 4px 15px ${'rgba(0, 0, 0, 0.08)'}`,
          lineHeight: 1.6, fontSize: '1rem'
        }}>
          <p style={{ margin: 0, fontWeight: 500 }}>{t('chat.analysisApproved')}</p>
          <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
            {t('chat.analysisApprovedDesc')}
          </p>
        </div>
        <StrategicMessage
          strategicData={strategicData}
          isLoading={isStrategicLoading}
          isApproved={isStrategicApproved}
          onModify={onModifyStrategic}
          onApprove={onApproveStrategic}
          onUpdate={onUpdateStrategic}
        />
      </div>
    </div>
    );
};

const GenerationConfigView = ({ onSubmitGeneration, isGenerating, aiPersonas = null }) => {
    const t = useT();
    return (
    <div style={{ display: 'flex', gap: '16px', maxWidth: '100%' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '14px', backgroundColor: COLORS.LG_RED,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.WHITE,
        boxShadow: '0 4px 10px rgba(165, 0, 52, 0.2)', flexShrink: 0
      }}>
        <Bot size={22} />
      </div>
      <div style={{flex: 1}}>
        <div style={{
          padding: '1.2rem 1.5rem', borderRadius: '20px', borderTopLeftRadius: '4px',
          backgroundColor: COLORS.WHITE, boxShadow: `0 4px 15px ${'rgba(0, 0, 0, 0.08)'}`,
          lineHeight: 1.6, fontSize: '1rem'
        }}>
          <p style={{ margin: 0, fontWeight: 500 }}>{t('chat.strategicApproved')}</p>
          <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
            {t('chat.strategicApprovedDesc')}
          </p>
        </div>
        <GenerationConfig onSubmit={onSubmitGeneration} isGenerating={isGenerating} aiPersonas={aiPersonas} />
      </div>
    </div>
    );
};

const CopyResultsView = ({ copyResults, isGenerating, onUpdateCopyResults, onReview, copyCandidates = null, selectedCandidateIdx = 0, onSelectCandidate = null }) => {
    const t = useT();
    const candidates = copyCandidates?.candidates || [];
    const hasCandidates = candidates.length > 1;
    const [skillReviewOpen, setSkillReviewOpen] = useState(false);

    return (
        <div style={{ display: 'flex', gap: '16px', maxWidth: '100%' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '14px', backgroundColor: '#D97706',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.WHITE,
            boxShadow: '0 4px 10px rgba(217, 119, 6, 0.2)', flexShrink: 0
          }}>
            <Bot size={22} />
          </div>
          <div style={{flex: 1}}>
            <div style={{
              padding: '1.2rem 1.5rem', borderRadius: '20px', borderTopLeftRadius: '4px',
              backgroundColor: COLORS.WHITE, boxShadow: `0 4px 15px ${'rgba(0, 0, 0, 0.08)'}`,
              lineHeight: 1.6, fontSize: '1rem'
            }}>
              <p style={{ margin: 0, fontWeight: 500 }}>{t('copy.completed')} ✅</p>
              {hasCandidates ? (
                <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
                  {t('copy.candidatesMsg', { n: candidates.length })}
                </p>
              ) : (
                <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
                  {t('copy.standardMsg')}
                </p>
              )}
            </div>

            {/* Persona candidate tabs */}
            {hasCandidates && (
              <div style={{
                display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap',
              }}>
                {candidates.map((c, idx) => (
                  <button
                    key={c.persona_id}
                    onClick={() => onSelectCandidate?.(idx)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', borderRadius: '12px',
                      border: `1.5px solid ${idx === selectedCandidateIdx ? '#7C3AED' : COLORS.BORDER}`,
                      backgroundColor: idx === selectedCandidateIdx ? '#F5F3FF' : COLORS.WHITE,
                      color: idx === selectedCandidateIdx ? '#7C3AED' : COLORS.TEXT_MAIN,
                      fontWeight: idx === selectedCandidateIdx ? 700 : 500,
                      fontSize: '0.85rem', cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{resolveAvatar(c.persona_avatar)}</span>
                    <span>{c.persona_name || c.persona_id}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Skill reviews for current candidate — collapsed by default */}
            {hasCandidates && candidates[selectedCandidateIdx]?.skill_reviews && Object.keys(candidates[selectedCandidateIdx]?.skill_reviews || {}).length > 0 && (
              <div style={{
                marginTop: '10px', borderRadius: '12px',
                backgroundColor: '#FAFAFA', border: `1px solid ${COLORS.BORDER}`,
                overflow: 'hidden',
              }}>
                <div
                  onClick={() => setSkillReviewOpen(p => !p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '10px 16px', cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  {skillReviewOpen
                    ? <ChevronDown size={14} color={COLORS.TEXT_SUB} />
                    : <ChevronRight size={14} color={COLORS.TEXT_SUB} />}
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: COLORS.TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('copy.skillReviews')}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: COLORS.TEXT_SUB, marginLeft: 'auto' }}>
                    {Object.keys(candidates[selectedCandidateIdx]?.skill_reviews || {}).length} skills
                  </span>
                </div>
                {skillReviewOpen && (
                  <div style={{ padding: '0 16px 12px' }}>
                    {Object.entries(candidates[selectedCandidateIdx]?.skill_reviews || {}).map(([skill, review]) => (
                      <div key={skill} style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 600, color: COLORS.TEXT_MAIN, minWidth: '180px' }}>{skill}</span>
                        <span style={{ color: COLORS.TEXT_SUB }}>{review}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <CopyResults results={copyResults} isGenerating={isGenerating} onUpdate={onUpdateCopyResults} onReview={onReview} />
          </div>
        </div>
    );
};


const COUNTRY_META = {
    US: { label: 'USA', flag: '🇺🇸' }, DE: { label: 'Germany', flag: '🇩🇪' },
    GB: { label: 'UK', flag: '🇬🇧' }, FR: { label: 'France', flag: '🇫🇷' },
    IT: { label: 'Italy', flag: '🇮🇹' }, ES: { label: 'Spain', flag: '🇪🇸' },
    IN: { label: 'India', flag: '🇮🇳' }, BR: { label: 'Brazil', flag: '🇧🇷' },
    KR: { label: 'Korea', flag: '🇰🇷' }, AU: { label: 'Australia', flag: '🇦🇺' },
    ID: { label: 'Indonesia', flag: '🇮🇩' }, SA: { label: 'Saudi Arabia', flag: '🇸🇦' },
    JP: { label: 'Japan', flag: '🇯🇵' }, CN: { label: 'China', flag: '🇨🇳' },
    NL: { label: 'Netherlands', flag: '🇳🇱' }, PL: { label: 'Poland', flag: '🇵🇱' },
    SE: { label: 'Sweden', flag: '🇸🇪' }, TH: { label: 'Thailand', flag: '🇹🇭' },
    CA: { label: 'Canada', flag: '🇨🇦' }, MX: { label: 'Mexico', flag: '🇲🇽' },
    AR: { label: 'Argentina', flag: '🇦🇷' }, AE: { label: 'UAE', flag: '🇦🇪' },
    ZA: { label: 'South Africa', flag: '🇿🇦' },
};

/* ─── Review Results: 국가별 → 카피별 → 스킬별 (접기/펼치기) ─── */

const ReviewBadgeList = ({ icon, label, color, bg, border, items, selectable = false, selectedItems, onToggle }) => {
    if (!items || items.length === 0) return null;
    return (
        <div style={{ marginBottom: '10px' }}>
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '0.7rem', fontWeight: 800, color, textTransform: 'uppercase',
                letterSpacing: '0.5px', marginBottom: '5px',
            }}>
                <span style={{ fontSize: '0.85rem' }}>{icon}</span> {label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {items.map((text, i) => (
                    <div
                        key={i}
                        onClick={selectable ? () => onToggle?.(i) : undefined}
                        style={{
                            padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem',
                            lineHeight: 1.6, color: COLORS.TEXT_MAIN,
                            backgroundColor: selectable && selectedItems?.has(i) ? '#DBEAFE' : bg,
                            borderLeft: `3px solid ${selectable && selectedItems?.has(i) ? '#2563EB' : border}`,
                            cursor: selectable ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'flex-start', gap: '8px',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {selectable && (
                            <span style={{
                                width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                                border: selectedItems?.has(i) ? '2px solid #2563EB' : `2px solid ${COLORS.BORDER}`,
                                backgroundColor: selectedItems?.has(i) ? '#2563EB' : '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '10px', fontWeight: 800, color: '#fff',
                                transition: 'all 0.15s ease',
                            }}>
                                {selectedItems?.has(i) ? '✓' : ''}
                            </span>
                        )}
                        <span style={{ flex: 1 }}>{text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SkillDetailRow = ({ skillId, score, passed, strengths = [], weaknesses = [], improvements = [], selectedImprovements, onToggleImprovement, t: _t }) => {
    const t = _t || useT();
    const [open, setOpen] = useState(false);
    const scoreColor = score >= 70 ? '#16A34A' : score >= 40 ? '#A16207' : '#DC2626';
    const scoreBg = score >= 70 ? '#DCFCE7' : score >= 40 ? '#FEF9C3' : '#FEE2E2';
    return (
        <div style={{
            marginBottom: '8px', borderRadius: '12px', overflow: 'hidden',
            border: `1px solid ${open ? (passed ? '#86EFAC' : '#FCA5A5') : COLORS.BORDER}`,
            transition: 'border-color 0.15s ease',
        }}>
            {/* 스킬 헤더 */}
            <div
                onClick={() => setOpen(p => !p)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
                    cursor: 'pointer', backgroundColor: COLORS.WHITE,
                }}
            >
                <span style={{
                    width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: passed ? '#DCFCE7' : '#FEE2E2',
                    fontSize: '0.7rem', fontWeight: 800,
                    color: passed ? '#16A34A' : '#DC2626',
                }}>
                    {passed ? '✓' : '!'}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: COLORS.TEXT_MAIN, flex: 1 }}>{skillId}</span>
                <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: '10px',
                    backgroundColor: scoreBg, color: scoreColor,
                }}>{score}/100</span>
                <span style={{ fontSize: '0.7rem', color: COLORS.TEXT_SUB, transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
            </div>

            {/* 강점/약점/보완 상세 — 카드 안에 표시 */}
            {open && (
                <div style={{
                    padding: '12px 16px 8px', backgroundColor: '#FAFBFC',
                    borderTop: `1px solid ${COLORS.BORDER}`,
                }}>
                    <ReviewBadgeList icon="✦" label={t('review.strengths')} color="#16A34A" bg="#F0FDF4" border="#16A34A" items={strengths} />
                    <ReviewBadgeList icon="▲" label={t('review.weaknesses')} color="#DC2626" bg="#FEF2F2" border="#DC2626" items={weaknesses} />
                    <ReviewBadgeList icon="→" label={t('review.improvements')} color="#2563EB" bg="#EFF6FF" border="#2563EB" items={improvements} selectable selectedItems={selectedImprovements} onToggle={onToggleImprovement} />
                    {strengths.length === 0 && weaknesses.length === 0 && improvements.length === 0 && (
                        <div style={{ color: COLORS.TEXT_SUB, fontStyle: 'italic', fontSize: '0.8rem', padding: '4px 0' }}>{t('review.noDetail')}</div>
                    )}
                </div>
            )}
        </div>
    );
};

const CopyReviewItem = ({ data, onCorrect, isCorrectLoading, correctedCopy, onUpdate, isUpdateLoading }) => {
    const [open, setOpen] = useState(false);
    // selectedImprovements: { skillIndex: Set<itemIndex> }
    const [selectedImprovements, setSelectedImprovements] = useState({});
    const { copyKey, skills, avgScore, allPassed, lowestSkill, copyInfo } = data;

    const toggleImprovement = (skillIdx, itemIdx) => {
        setSelectedImprovements(prev => {
            const next = { ...prev };
            if (!next[skillIdx]) next[skillIdx] = new Set();
            else next[skillIdx] = new Set(next[skillIdx]);
            if (next[skillIdx].has(itemIdx)) next[skillIdx].delete(itemIdx);
            else next[skillIdx].add(itemIdx);
            return next;
        });
    };

    const getSelectedImprovementTexts = () => {
        const texts = [];
        Object.entries(selectedImprovements).forEach(([sIdx, items]) => {
            const skill = skills[Number(sIdx)];
            if (!skill) return;
            items.forEach(itemIdx => {
                const text = (skill.improvements || [])[itemIdx];
                if (text) texts.push({ skillId: skill.skillId, text });
            });
        });
        return texts;
    };

    const totalSelected = Object.values(selectedImprovements).reduce((s, set) => s + set.size, 0);
    return (
        <div style={{ marginLeft: '16px', marginBottom: '8px' }}>
            {/* 카피 헤더 — 클릭으로 접기/펼치기 */}
            <div
                onClick={() => setOpen(p => !p)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                    padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                    backgroundColor: COLORS.WHITE,
                    border: `1px solid ${open ? COLORS.LG_RED + '60' : COLORS.BORDER}`,
                    transition: 'border-color 0.15s ease',
                }}
            >
                <span style={{ fontSize: '0.75rem', color: COLORS.TEXT_SUB, width: '14px', flexShrink: 0 }}>
                    {open ? '▾' : '▸'}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: COLORS.LG_RED }}>
                    [Copy {(copyInfo.index ?? 0) + 1}]
                </span>
                <span style={{
                    fontSize: '0.8rem', color: COLORS.TEXT_MAIN, flex: 1, minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {copyInfo.headline || '—'}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.TEXT_SUB, flexShrink: 0 }}>
                    Review Score : <span style={{
                        color: avgScore >= 70 ? '#16A34A' : avgScore >= 40 ? '#A16207' : '#DC2626',
                    }}>{avgScore}</span>
                </span>
                <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', flexShrink: 0,
                    backgroundColor: allPassed ? '#DCFCE7' : '#fef9e2',
                    color: allPassed ? '#16A34A' : '#f79708',
                }}>
                    {allPassed ? 'All Pass' : 'Need Check'}
                </span>
                {lowestSkill && !allPassed && (
                    <span style={{ fontSize: '0.7rem', color: '#DC2626', flexShrink: 0 }}>
                        {lowestSkill.skillId}
                    </span>
                )}
            </div>

            {/* 카피 내용 + 스킬 상세 — 카피 펼쳤을 때만 표시 */}
            {open && (
                <div style={{ marginLeft: '16px', marginTop: '6px' }}>
                    {/* 카피 본문 미리보기 */}
                    <div style={{
                        padding: '10px 14px', borderRadius: '10px', marginBottom: '8px',
                        backgroundColor: '#F8FAFC', border: `1px solid ${COLORS.BORDER}`,
                        fontSize: '0.8rem', lineHeight: 1.7, color: COLORS.TEXT_MAIN,
                    }}>
                        {copyInfo.headline && (
                            <div style={{ marginBottom: '4px' }}>
                                <span style={{ fontWeight: 700, color: COLORS.TEXT_SUB, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Headline</span>
                                <div style={{ fontWeight: 600 }}>{copyInfo.headline}</div>
                            </div>
                        )}
                        {copyInfo.subheadline && (
                            <div style={{ marginBottom: '4px' }}>
                                <span style={{ fontWeight: 700, color: COLORS.TEXT_SUB, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subheadline</span>
                                <div>{copyInfo.subheadline}</div>
                            </div>
                        )}
                        {copyInfo.bodyCopy && (
                            <div style={{ marginBottom: '4px' }}>
                                <span style={{ fontWeight: 700, color: COLORS.TEXT_SUB, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Body Copy</span>
                                <div>{copyInfo.bodyCopy}</div>
                            </div>
                        )}
                        {copyInfo.cta && (
                            <div>
                                <span style={{ fontWeight: 700, color: COLORS.TEXT_SUB, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Call to Action</span>
                                <div style={{ fontWeight: 600, color: COLORS.LG_RED }}>{copyInfo.cta}</div>
                            </div>
                        )}
                    </div>

                    {/* 스킬별 판정 */}
                    {skills.map((r, si) => (
                        <SkillDetailRow
                            key={si}
                            skillId={`${si + 1}) ${r.skillId}`}
                            score={r.score}
                            passed={r.passed}
                            strengths={r.strengths}
                            weaknesses={r.weaknesses}
                            improvements={r.improvements}
                            selectedImprovements={selectedImprovements[si]}
                            onToggleImprovement={(itemIdx) => toggleImprovement(si, itemIdx)}
                        />
                    ))}

                    {/* Correct 버튼 + 보정 결과 */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button
                            onClick={() => onCorrect?.(copyKey, copyInfo, getSelectedImprovementTexts())}
                            disabled={totalSelected === 0 || isCorrectLoading}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '7px 16px', borderRadius: '10px', border: 'none',
                                fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit',
                                cursor: totalSelected === 0 || isCorrectLoading ? 'not-allowed' : 'pointer',
                                background: totalSelected > 0 ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : '#E2E8F0',
                                color: totalSelected > 0 ? '#fff' : '#94A3B8',
                                boxShadow: totalSelected > 0 ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                                opacity: isCorrectLoading ? 0.7 : 1,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {isCorrectLoading ? (
                                <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Correcting...</>
                            ) : (
                                <><Pencil size={14} /> Correct{totalSelected > 0 ? ` (${totalSelected})` : ''}</>
                            )}
                        </button>
                    </div>

                    {/* 보정 결과 표시 — 원본과 다른 필드 하이라이트 */}
                    {correctedCopy && (() => {
                        const changed = (field) => correctedCopy[field] && correctedCopy[field] !== (copyInfo[field] || '');
                        const changedBadge = <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', backgroundColor: '#DBEAFE', color: '#1E40AF', marginLeft: '6px' }}>CHANGED</span>;
                        return (
                        <div style={{
                            marginTop: '10px', padding: '14px 16px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #EFF6FF, #F0F9FF)',
                            border: '1px solid #93C5FD',
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px',
                                fontSize: '0.75rem', fontWeight: 800, color: '#1D4ED8',
                                textTransform: 'uppercase', letterSpacing: '0.5px',
                            }}>
                                <Pencil size={13} /> Corrected Copy
                            </div>
                            {correctedCopy.headline && (
                                <div style={{ marginBottom: '6px' }}>
                                    <span style={{ fontWeight: 700, color: COLORS.TEXT_SUB, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Headline{changed('headline') && changedBadge}</span>
                                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: changed('headline') ? '#1D4ED8' : COLORS.TEXT_MAIN }}>{correctedCopy.headline}</div>
                                </div>
                            )}
                            {correctedCopy.subheadline && (
                                <div style={{ marginBottom: '6px' }}>
                                    <span style={{ fontWeight: 700, color: COLORS.TEXT_SUB, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subheadline{changed('subheadline') && changedBadge}</span>
                                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: changed('subheadline') ? '#1D4ED8' : COLORS.LG_RED }}>{correctedCopy.subheadline}</div>
                                </div>
                            )}
                            {correctedCopy.bodyCopy && (
                                <div style={{ marginBottom: '6px' }}>
                                    <span style={{ fontWeight: 700, color: COLORS.TEXT_SUB, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Body Copy{changed('bodyCopy') && changedBadge}</span>
                                    <div style={{ fontSize: '0.85rem', lineHeight: 1.7, color: COLORS.TEXT_MAIN, whiteSpace: 'pre-wrap' }}>{correctedCopy.bodyCopy}</div>
                                </div>
                            )}
                            {correctedCopy.cta && (
                                <div>
                                    <span style={{ fontWeight: 700, color: COLORS.TEXT_SUB, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Call to Action{changed('cta') && changedBadge}</span>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D4ED8' }}>{correctedCopy.cta}</div>
                                </div>
                            )}

                            {/* Update 버튼 */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #BFDBFE' }}>
                                <button
                                    onClick={() => { setSelectedImprovements({}); onUpdate?.(copyKey, correctedCopy); }}
                                    disabled={isUpdateLoading}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        padding: '8px 18px', borderRadius: '10px', border: 'none',
                                        fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit',
                                        cursor: isUpdateLoading ? 'not-allowed' : 'pointer',
                                        background: 'linear-gradient(135deg, #059669, #047857)',
                                        color: '#fff',
                                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                                        opacity: isUpdateLoading ? 0.7 : 1,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {isUpdateLoading ? (
                                        <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Re-evaluating...</>
                                    ) : (
                                        <><CheckCircle size={14} /> Update &amp; Re-evaluate</>
                                    )}
                                </button>
                            </div>
                        </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

const buildReviewTree = (reviewResults, copyResults) => {
    if (!reviewResults || reviewResults.length === 0 || !copyResults) return [];

    // copyResults에서 국가→카피 매핑 구축
    const copyMap = {};
    (copyResults || []).forEach(r => {
        const copies = r.copies || [r];
        copies.forEach((copy, idx) => {
            const key = `${r.countryCode}-${idx}`;
            copyMap[key] = { ...copy, countryCode: r.countryCode, index: idx };
        });
    });

    // 국가별 → 카피별 → 스킬별 그룹핑
    const countryGroups = {};
    reviewResults.forEach(r => {
        const cc = r.targetCopyKey?.split('-')[0] || 'XX';
        if (!countryGroups[cc]) countryGroups[cc] = {};
        if (!countryGroups[cc][r.targetCopyKey]) countryGroups[cc][r.targetCopyKey] = [];
        countryGroups[cc][r.targetCopyKey].push(r);
    });

    // 국가별 평균 점수 계산 + 정렬
    const countries = Object.entries(countryGroups).map(([cc, copies]) => {
        const allResults = Object.values(copies).flat();
        const avgScore = allResults.length > 0
            ? Math.round(allResults.reduce((s, r) => s + r.score, 0) / allResults.length)
            : 0;

        const copyEntries = Object.entries(copies).map(([copyKey, skills]) => {
            const copyAvg = skills.length > 0
                ? Math.round(skills.reduce((s, r) => s + r.score, 0) / skills.length)
                : 0;
            const allPassed = skills.every(r => r.passed);
            const lowestSkill = skills.reduce((min, r) => r.score < min.score ? r : min, skills[0]);
            const copyInfo = copyMap[copyKey] || {};
            return { copyKey, skills, avgScore: copyAvg, allPassed, lowestSkill, copyInfo };
        });
        // 카피도 점수 내림차순
        copyEntries.sort((a, b) => b.avgScore - a.avgScore);

        return { countryCode: cc, avgScore, copies: copyEntries, totalResults: allResults.length };
    });

    // 국가 점수 내림차순
    countries.sort((a, b) => b.avgScore - a.avgScore);
    return countries;
};

// ─── Review 스킬 그룹 정의 (Skill_List.md 기준) ───
const REVIEW_SKILL_GROUPS = [
    {
        id: 'must-have',
        label: 'Must-Have Evaluation',
        labelKey: 'review.group.mustHave',
        color: '#DC2626',
        bg: '#FEF2F2',
        skills: ['regulatory-copy-validation', 'brand-lexicon-check', 'copy-scorecard-generator', 'compliance-redflag-detector', 'lg-brand-fit-check'],
    },
    {
        id: 'compliance',
        label: 'Compliance',
        labelKey: 'review.group.compliance',
        color: '#D97706',
        bg: '#FFFBEB',
        skills: ['ai-washing-risk-check', 'environmental-claim-risk-check', 'comparative-ad-risk-check'],
    },
    {
        id: 'quality',
        label: 'Quality Review',
        labelKey: 'review.group.quality',
        color: '#2563EB',
        bg: '#EFF6FF',
        skills: ['claim-extractor', 'proof-point-checker', 'creative-impact-scorer'],
    },
    {
        id: 'differentiation',
        label: 'Differentiation',
        labelKey: 'review.group.differentiation',
        color: '#7C3AED',
        bg: '#F5F3FF',
        skills: ['competitive-differentiation-review', 'competitor-copy-contrast-check'],
    },
    {
        id: 'localization',
        label: 'Localization',
        labelKey: 'review.group.localization',
        color: '#059669',
        bg: '#ECFDF5',
        skills: ['regional-culture-fit-check', 'seasonality-fit-check', 'customer-segment-fit-check'],
    },
];

// 그룹에 속하지 않는 스킬을 모으는 함수
function groupSkillsForReview(allSkills) {
    const grouped = [];
    const usedIds = new Set();

    for (const group of REVIEW_SKILL_GROUPS) {
        const items = group.skills
            .map(id => allSkills.find(s => s.id === id))
            .filter(Boolean);
        if (items.length > 0) {
            grouped.push({ ...group, items });
            items.forEach(s => usedIds.add(s.id));
        }
    }

    // 그룹에 속하지 않은 나머지 스킬 (커스텀 등)
    const others = allSkills.filter(s =>
        !usedIds.has(s.id)
        && !s.id?.startsWith('writer-')
        && !s.id?.startsWith('culture-')
        && s.id !== 'workflow-adcopy-production'
        && s.id !== 'localization-base'
        && s.id !== 'lg-brand-voice'
        && s.id !== 'SKILLMD-generator'
    );
    if (others.length > 0) {
        grouped.push({
            id: 'other',
            label: 'Other Skills',
            labelKey: 'review.group.other',
            color: COLORS.TEXT_SUB,
            bg: '#F9FAFB',
            items: others,
        });
    }

    return grouped;
}

const ReviewView = ({ enabledSkills, onToggleSkill, onSubmitReview, isReviewing = false, copyResults = [], selectedCopies, onToggleCopy, availableSkills }) => {
    const t = useT();
    const skillsList = availableSkills || [];
    const allGroups = groupSkillsForReview(skillsList);
    const [skillSearch, setSkillSearch] = useState('');

    // 검색 필터 적용
    const skillGroups = skillSearch.trim()
        ? allGroups.map(g => ({
            ...g,
            items: g.items.filter(s =>
                (s.id || '').toLowerCase().includes(skillSearch.toLowerCase())
                || (s.label || '').toLowerCase().includes(skillSearch.toLowerCase())
                || (s.description || s.desc || '').toLowerCase().includes(skillSearch.toLowerCase())
            ),
        })).filter(g => g.items.length > 0)
        : allGroups;

    const styles = {
        container: {
            padding: '1.5rem',
            borderRadius: '20px',
            backgroundColor: 'rgba(240, 240, 240, 0.5)',
            border: `1px solid ${COLORS.BORDER}`,
            marginTop: '1.5rem',
        },
        header: {
            fontSize: '1.1rem', fontWeight: 800, color: COLORS.TEXT_MAIN,
            marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px',
        },
        subheader: {
            fontSize: '0.85rem', color: COLORS.TEXT_SUB, marginBottom: '1.5rem', lineHeight: 1.5,
        },
        sectionTitle: {
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '0.82rem', fontWeight: 700, color: COLORS.TEXT_SUB,
            textTransform: 'uppercase', letterSpacing: '0.5px',
            marginBottom: '0.75rem', marginTop: 0,
        },
        divider: {
            borderTop: `1px solid ${COLORS.BORDER}`, margin: '1.5rem 0',
        },
        countryGroup: {
            marginBottom: '12px',
        },
        countryLabel: {
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '0.88rem', fontWeight: 700, color: COLORS.TEXT_MAIN,
            marginBottom: '8px',
        },
        copyCheckbox: (checked) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
            border: `1.5px solid ${checked ? COLORS.LG_RED : COLORS.BORDER}`,
            backgroundColor: checked ? '#FFF0F3' : COLORS.WHITE,
            transition: 'all 0.15s ease', marginBottom: '6px',
        }),
        checkMark: (checked) => ({
            width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
            border: `1.5px solid ${checked ? COLORS.LG_RED : COLORS.BORDER}`,
            backgroundColor: checked ? COLORS.LG_RED : COLORS.WHITE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: COLORS.WHITE, fontSize: '10px', fontWeight: 700,
        }),
        copyLabel: (checked) => ({
            fontSize: '0.85rem', fontWeight: 500,
            color: checked ? COLORS.LG_RED : COLORS.TEXT_MAIN,
        }),
        copyPreview: {
            fontSize: '0.78rem', color: COLORS.TEXT_SUB,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '400px',
        },
        skillRow: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: '12px', backgroundColor: COLORS.WHITE,
            border: `1px solid ${COLORS.BORDER}`, marginBottom: '8px',
        },
        skillInfo: { flex: 1 },
        skillLabel: { fontSize: '0.85rem', fontWeight: 600, color: COLORS.TEXT_MAIN, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' },
        skillDesc: { fontSize: '0.75rem', color: COLORS.TEXT_SUB, margin: '2px 0 0 0' },
        toggle: (on) => ({
            width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer',
            backgroundColor: on ? COLORS.LG_RED : '#D1D5DB',
            position: 'relative', transition: 'background-color 0.2s ease',
            border: 'none', padding: 0, flexShrink: 0,
        }),
        toggleKnob: (on) => ({
            width: '18px', height: '18px', borderRadius: '50%',
            backgroundColor: COLORS.WHITE, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            position: 'absolute', top: '2px',
            left: on ? '20px' : '2px', transition: 'left 0.2s ease',
        }),
        typeBadge: (type) => ({
            fontSize: '0.65rem', fontWeight: 600, padding: '1px 6px', borderRadius: '4px',
            backgroundColor: type === 'skillmd' ? '#F0FDF4' : '#FFF7ED',
            color: type === 'skillmd' ? '#15803D' : '#C2410C',
        }),
        categoryBadge: (cat) => ({
            fontSize: '0.6rem', fontWeight: 600, padding: '1px 5px', borderRadius: '3px',
            backgroundColor: cat === 'validation' ? '#FEF3C7' : cat === 'generation' ? '#DBEAFE' : '#E0E7FF',
            color: cat === 'validation' ? '#92400E' : cat === 'generation' ? '#1E40AF' : '#3730A3',
            marginLeft: '4px',
        }),
    };

    return (
        <div style={{ display: 'flex', gap: '16px', maxWidth: '100%' }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '14px', backgroundColor: COLORS.LG_RED,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.WHITE,
                boxShadow: '0 4px 10px rgba(165, 0, 52, 0.2)', flexShrink: 0
            }}>
                <Bot size={22} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{
                    padding: '1.2rem 1.5rem', borderRadius: '20px', borderTopLeftRadius: '4px',
                    backgroundColor: COLORS.WHITE, boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                    lineHeight: 1.6, fontSize: '1rem'
                }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>{t('chat.copyGenerated')}</p>
                    <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
                        {t('chat.copyGeneratedDesc')}
                    </p>
                </div>
                <div style={styles.container}>
                    <h3 style={styles.header}>
                        <Cpu size={22} color={COLORS.LG_RED} />{t('review.settings')}
                    </h3>
                    <p style={styles.subheader}>
                        {t('review.desc')}
                    </p>

                    {/* Target Copy */}
                    <div style={styles.sectionTitle}>
                        <Globe size={14} />{t('review.targetCopy')}
                    </div>
                    <div>
                        {(copyResults || []).map(r => {
                            const meta = COUNTRY_META[r.countryCode] || { label: r.countryCode, flag: '🌐' };
                            const copies = r.copies || [r];
                            return (
                                <div key={r.countryCode} style={styles.countryGroup}>
                                    <div style={styles.countryLabel}>
                                        <span>{meta.flag}</span>
                                        <span>{meta.label}</span>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
                                            {copies.length}개
                                        </span>
                                    </div>
                                    {copies.map((copy, idx) => {
                                        const copyKey = `${r.countryCode}-${idx}`;
                                        const isChecked = selectedCopies.has(copyKey);
                                        return (
                                            <div
                                                key={idx}
                                                style={styles.copyCheckbox(isChecked)}
                                                onClick={() => onToggleCopy(copyKey)}
                                            >
                                                <div style={styles.checkMark(isChecked)}>
                                                    {isChecked && '✓'}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <span style={styles.copyLabel(isChecked)}>Copy {idx + 1}</span>
                                                    {copy.headline && (
                                                        <p style={styles.copyPreview}>{copy.headline}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    <div style={styles.divider} />

                    {/* Use Skillsets — grouped by category */}
                    <div style={{ ...styles.sectionTitle, flexWrap: 'wrap' }}>
                        <Cpu size={14} />{t('review.useSkillsets')}
                        <span style={{ fontSize: '0.7rem', color: COLORS.TEXT_SUB, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                            ({t('review.available', { n: skillsList.length })})
                        </span>
                        <div style={{ marginLeft: 'auto', position: 'relative' }}>
                            <input
                                type="text"
                                value={skillSearch}
                                onChange={e => setSkillSearch(e.target.value)}
                                placeholder="Search skills..."
                                style={{
                                    width: '180px', padding: '5px 10px 5px 28px',
                                    borderRadius: '8px', border: `1px solid ${COLORS.BORDER}`,
                                    fontSize: '0.75rem', fontWeight: 400, fontFamily: 'inherit',
                                    outline: 'none', backgroundColor: COLORS.WHITE,
                                    textTransform: 'none', letterSpacing: 0,
                                }}
                            />
                            <Globe size={12} style={{ position: 'absolute', left: '9px', top: '7px', color: COLORS.TEXT_SUB }} />
                            {skillSearch && (
                                <button
                                    onClick={() => setSkillSearch('')}
                                    style={{
                                        position: 'absolute', right: '6px', top: '4px',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: 0, color: COLORS.TEXT_SUB, fontSize: '0.7rem',
                                    }}
                                >✕</button>
                            )}
                        </div>
                    </div>
                    <div>
                        {skillGroups.map(group => {
                            const enabledInGroup = group.items.filter(s => enabledSkills.includes(s.id)).length;
                            return (
                                <div key={group.id} style={{ marginBottom: '16px' }}>
                                    {/* Group header */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '8px 12px', borderRadius: '10px',
                                        backgroundColor: group.bg, marginBottom: '8px',
                                    }}>
                                        <span style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            backgroundColor: group.color, flexShrink: 0,
                                        }} />
                                        <span style={{
                                            fontSize: '0.78rem', fontWeight: 700, color: group.color,
                                            textTransform: 'uppercase', letterSpacing: '0.3px',
                                        }}>
                                            {group.label}
                                        </span>
                                        <span style={{
                                            fontSize: '0.68rem', fontWeight: 600, color: COLORS.TEXT_SUB,
                                            marginLeft: 'auto',
                                        }}>
                                            {enabledInGroup}/{group.items.length} ON
                                        </span>
                                    </div>
                                    {/* Skills in group */}
                                    {group.items.map(s => (
                                        <div key={s.id} style={styles.skillRow}>
                                            <div style={styles.skillInfo}>
                                                <p style={styles.skillLabel}>
                                                    {s.label || s.id}
                                                    <span style={styles.typeBadge(s.type)}>{s.type}</span>
                                                </p>
                                                <p style={styles.skillDesc}>{s.description || s.desc}</p>
                                            </div>
                                            <button
                                                style={styles.toggle(enabledSkills.includes(s.id))}
                                                onClick={() => onToggleSkill(s.id)}
                                            >
                                                <div style={styles.toggleKnob(enabledSkills.includes(s.id))} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button
                            style={{
                                padding: '12px 32px', borderRadius: '12px', border: 'none',
                                fontWeight: 700, fontSize: '0.95rem',
                                cursor: (isReviewing || selectedCopies.size === 0 || enabledSkills.length === 0) ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                backgroundColor: COLORS.LG_RED, color: COLORS.WHITE,
                                boxShadow: '0 8px 20px rgba(165, 0, 52, 0.25)',
                                transition: 'all 0.2s ease', fontFamily: 'inherit',
                                opacity: (isReviewing || selectedCopies.size === 0 || enabledSkills.length === 0) ? 0.7 : 1,
                            }}
                            onClick={onSubmitReview}
                            disabled={isReviewing || selectedCopies.size === 0 || enabledSkills.length === 0}
                        >
                            {isReviewing ? (
                                <>
                                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    {t('review.reviewing')}
                                </>
                            ) : (
                                <>
                                    <ArrowRight size={16} />
                                    {t('review.submitReview')}
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

const ReviewResultsView = ({ reviewResults, reviewSummary, copyResults, isReviewing, onSaveExit, onExitWithoutSave, isSaving = false, onCorrectCopy, onUpdateAndReReview }) => {
    const t = useT();
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [correctingKey, setCorrectingKey] = useState(null);
    const [correctedCopies, setCorrectedCopies] = useState({});
    const [updatingKey, setUpdatingKey] = useState(null);

    const handleCorrect = async (copyKey, copyInfo, improvements) => {
        if (!onCorrectCopy) return;
        setCorrectingKey(copyKey);
        try {
            const result = await onCorrectCopy(copyKey, copyInfo, improvements);
            if (result) setCorrectedCopies(prev => ({ ...prev, [copyKey]: result }));
        } finally {
            setCorrectingKey(null);
        }
    };

    const handleUpdate = async (copyKey, correctedCopy) => {
        if (!onUpdateAndReReview) return;
        setUpdatingKey(copyKey);
        try {
            await onUpdateAndReReview(copyKey, correctedCopy);
            // 완료 후: corrected copy 카드 제거
            setCorrectedCopies(prev => { const next = { ...prev }; delete next[copyKey]; return next; });
        } finally {
            setUpdatingKey(null);
        }
    };
    const tree = buildReviewTree(reviewResults, copyResults);
    const totalCountries = tree.length;
    const totalCopies = tree.reduce((s, c) => s + c.copies.length, 0);
    const totalSkills = new Set((reviewResults || []).map(r => r.skillId)).size;
    const totalResults = (reviewResults || []).length;
    const overallAvg = totalResults > 0
        ? Math.round((reviewResults || []).reduce((s, r) => s + r.score, 0) / totalResults)
        : 0;

    return (
        <div style={{ display: 'flex', gap: '16px', maxWidth: '100%' }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '14px', backgroundColor: COLORS.LG_RED,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.WHITE,
                boxShadow: '0 4px 10px rgba(165, 0, 52, 0.2)', flexShrink: 0
            }}>
                <Bot size={22} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{
                    padding: '1.2rem 1.5rem', borderRadius: '20px', borderTopLeftRadius: '4px',
                    backgroundColor: COLORS.WHITE, boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                    lineHeight: 1.6, fontSize: '1rem',
                }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>
                        {isReviewing ? t('chat.reviewRunning') : t('chat.reviewDone')}
                    </p>
                    <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
                        {isReviewing ? t('review.runningDesc') : t('review.doneDesc')}
                    </p>
                </div>

                <div style={{
                    padding: '1.5rem', borderRadius: '20px',
                    backgroundColor: 'rgba(240, 240, 240, 0.5)',
                    border: `1px solid ${COLORS.BORDER}`, marginTop: '1rem',
                }}>
                    <h3 style={{
                        fontSize: '1.1rem', fontWeight: 800, color: COLORS.TEXT_MAIN,
                        marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                        {isReviewing
                            ? <Loader size={22} color={COLORS.LG_RED} style={{ animation: 'spin 1s linear infinite' }} />
                            : <CheckCircle size={22} color="#22C55E" />
                        }
                        {t('review.resultTitle')}
                        {!isReviewing && reviewSummary && (
                            <span style={{
                                fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: '6px',
                                backgroundColor: '#DCFCE7', color: '#16A34A', marginLeft: '4px',
                            }}>COMPLETED</span>
                        )}
                    </h3>

                    {/* 요약 헤더 */}
                    {reviewSummary && (
                        <div style={{
                            display: 'flex', gap: '12px', flexWrap: 'wrap',
                            padding: '12px 16px', borderRadius: '12px', marginBottom: '1rem',
                            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                            fontSize: '0.82rem', color: '#CBD5E1',
                        }}>
                            <span>국가 : <b style={{ color: '#93C5FD' }}>{totalCountries}</b></span>
                            <span style={{ color: '#475569' }}>|</span>
                            <span>Total Copys : <b style={{ color: '#93C5FD' }}>{totalCopies}</b></span>
                            <span style={{ color: '#475569' }}>|</span>
                            <span>Total Skills : <b style={{ color: '#93C5FD' }}>{totalSkills}</b></span>
                            <span style={{ color: '#475569' }}>|</span>
                            <span>Avg Score : <b style={{ color: overallAvg >= 70 ? '#86EFAC' : overallAvg >= 40 ? '#FCD34D' : '#FCA5A5' }}>{overallAvg}</b></span>
                        </div>
                    )}

                    {/* 국가별 그룹 */}
                    {tree.map(country => {
                        const meta = COUNTRY_META[country.countryCode] || { label: country.countryCode, flag: '🌐' };
                        return (
                            <div key={country.countryCode} style={{ marginBottom: '1.5rem' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 14px', borderRadius: '12px',
                                    backgroundColor: '#F1F5F9', marginBottom: '10px',
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>{meta.flag}</span>
                                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: COLORS.TEXT_MAIN }}>{meta.label}</span>
                                    <span style={{
                                        fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px',
                                        borderRadius: '6px', backgroundColor: '#E8F5E9', color: '#2E7D32',
                                    }}>{country.copies.length}개</span>
                                    <span style={{
                                        marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 700,
                                        color: country.avgScore >= 70 ? '#16A34A' : country.avgScore >= 40 ? '#A16207' : '#DC2626',
                                    }}>Avg {country.avgScore}</span>
                                </div>
                                {country.copies.map((copyData) => (
                                    <CopyReviewItem
                                        key={copyData.copyKey}
                                        data={copyData}
                                        onCorrect={handleCorrect}
                                        isCorrectLoading={correctingKey === copyData.copyKey}
                                        correctedCopy={correctedCopies[copyData.copyKey]}
                                        onUpdate={handleUpdate}
                                        isUpdateLoading={updatingKey === copyData.copyKey}
                                    />
                                ))}
                            </div>
                        );
                    })}

                    {isReviewing && totalResults === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: COLORS.TEXT_SUB }}>
                            <Loader size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>스킬별 검증을 실행하고 있습니다...</p>
                        </div>
                    )}
                </div>

                {/* 버튼 영역 — Review 완료 후 표시 */}
                {!isReviewing && reviewSummary && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '1.5rem' }}>
                        {onSaveExit && (
                            <button
                                onClick={onSaveExit}
                                disabled={isSaving}
                                style={{
                                    padding: '14px 36px', borderRadius: '14px', border: 'none',
                                    fontWeight: 700, fontSize: '0.95rem', fontFamily: 'inherit',
                                    cursor: isSaving ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                                    color: COLORS.WHITE,
                                    boxShadow: '0 8px 24px rgba(26, 26, 46, 0.35)',
                                    transition: 'all 0.2s ease',
                                    opacity: isSaving ? 0.7 : 1,
                                }}
                            >
                                {isSaving ? (
                                    <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> 저장 중...</>
                                ) : (
                                    <><Save size={16} /> Save & Exit</>
                                )}
                            </button>
                        )}
                        {onExitWithoutSave && (
                            <button
                                onClick={() => setShowExitConfirm(true)}
                                disabled={isSaving}
                                style={{
                                    padding: '14px 36px', borderRadius: '14px',
                                    fontWeight: 700, fontSize: '0.95rem', fontFamily: 'inherit',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                    backgroundColor: 'transparent', color: COLORS.TEXT_SUB,
                                    border: `1.5px solid ${COLORS.BORDER}`,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <LogOut size={16} /> Exit Without Save
                            </button>
                        )}
                    </div>
                )}

                {/* Exit 확인 팝업 */}
                {showExitConfirm && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <div style={{
                            backgroundColor: COLORS.WHITE, borderRadius: '20px', padding: '2rem',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxWidth: '400px', width: '90%',
                            textAlign: 'center',
                        }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 16px',
                                backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <AlertTriangle size={24} color="#DC2626" />
                            </div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 800, color: COLORS.TEXT_MAIN }}>
                                저장하지 않고 종료하시겠습니까?
                            </h3>
                            <p style={{ margin: '0 0 24px', fontSize: '0.88rem', color: COLORS.TEXT_SUB, lineHeight: 1.5 }}>
                                현재까지의 모든 작업 내용이 저장되지 않습니다.<br />이 작업은 되돌릴 수 없습니다.
                            </p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setShowExitConfirm(false)}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '12px',
                                        border: `1.5px solid ${COLORS.BORDER}`, backgroundColor: COLORS.WHITE,
                                        fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                                        color: COLORS.TEXT_MAIN, fontFamily: 'inherit',
                                    }}
                                >
                                    아니오
                                </button>
                                <button
                                    onClick={() => { setShowExitConfirm(false); onExitWithoutSave(); }}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '12px',
                                        border: 'none', backgroundColor: '#DC2626',
                                        fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                                        color: COLORS.WHITE, fontFamily: 'inherit',
                                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                                    }}
                                >
                                    예, 종료합니다
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export { InitialView, ResultView, StrategicMessageView, GenerationConfigView, CopyResultsView, ReviewView, ReviewResultsView };
