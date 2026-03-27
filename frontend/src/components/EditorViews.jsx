import React, { useState } from 'react';
import { Bot, Zap, Cpu, ArrowRight, Loader, Globe, CheckCircle, XCircle, AlertTriangle, Lock, Pencil, Trash2, Save, LogOut, FileText as FileTextIcon, Search as SearchIcon, MessageSquareText as MsgIcon, ClipboardCheck } from 'lucide-react';
import { COLORS } from '../styles/theme';
import AnalysisReport from './AnalysisReport';
import StrategicMessage from './StrategicMessage';
import GenerationConfig, { SKILLSETS } from './GenerationConfig';
import CopyResults from './CopyResults';

const WORKFLOW_STEPS = [
  {
    num: 1, label: 'Briefing', icon: FileTextIcon, color: COLORS.LG_RED, active: true,
    title: '캠페인 브리프 작성',
    desc: '좌측 패널에서 프로젝트명, 컨텍스트, 목표, 타겟 오디언스 등 캠페인의 핵심 정보를 입력합니다. "AI 자동생성" 버튼을 활용하면 프로젝트명과 컨텍스트만으로 나머지 항목을 자동 완성할 수 있습니다.',
  },
  {
    num: 2, label: 'Analysis', icon: SearchIcon, color: '#2563EB',
    title: 'Market Analyst Report',
    desc: 'Multi-Agent가 웹 검색과 RAG를 병렬 수행하여 타겟 시장, 경쟁 키워드, 페르소나, 문화적 인사이트 등 10개 항목의 분석 리포트를 생성합니다.',
  },
  {
    num: 3, label: 'Strategic Message', icon: MsgIcon, color: '#7C3AED',
    title: '핵심 메시지 도출',
    desc: '분석 리포트를 기반으로 Core Message, Message Pillars, Emotional Hook, Tone Direction 등 카피 생성의 전략적 방향을 자동 추출합니다.',
  },
  {
    num: 4, label: 'Generation', icon: Zap, color: '#D97706',
    title: '글로벌 카피 생성',
    desc: '타겟 국가, 연령대, 페르소나를 설정하면 각 시장에 맞는 현지화된 카피를 자동 생성합니다. 국가별 문화 적합성과 톤이 자동으로 조정됩니다.',
  },
  {
    num: 5, label: 'Review', icon: ClipboardCheck, color: '#059669',
    title: 'Skillset 품질 검증',
    desc: '생성된 카피를 AI Washing, 브랜드 용어, 문화 감수성 등 다양한 스킬셋으로 자동 검증합니다. 점수와 개선 제안을 확인한 뒤 최종 저장합니다.',
  },
];

const InitialView = () => (
  <>
    {/* 인사 메시지 */}
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
            안녕하세요! 저는 AI Copywriting Agent 입니다. 반가워요~
          </p>
          <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
            AI Copywriting Agent와 함께 글로벌 캠페인 카피를 만들어 보세요.
            아래 워크플로우를 따라 5단계로 진행됩니다.
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
        각 단계는 이전 단계의 승인 후 자동으로 진행됩니다. 언제든 수정하거나 되돌릴 수 있습니다.
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
                <p style={{
                  margin: '2px 0 0', fontSize: '0.8rem', lineHeight: 1.6,
                  color: isFirst ? COLORS.TEXT_MAIN : COLORS.TEXT_SUB,
                }}>
                  <strong style={{ color: isFirst ? s.color : COLORS.TEXT_MAIN }}>{s.title}</strong>
                  {' — '}{s.desc}
                </p>
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
          좌측 패널에서 캠페인 브리프를 작성해 주세요
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: COLORS.TEXT_SUB }}>
          프로젝트명과 Project Context를 입력한 뒤 "AI 자동생성"을 누르면 나머지 항목이 자동으로 채워집니다.
          모든 항목을 확인한 후 "분석 시작" 버튼을 클릭하세요.
        </p>
      </div>
    </div>
  </>
);

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

const StrategicMessageView = ({ strategicData, isStrategicLoading, isStrategicApproved, onModifyStrategic, onApproveStrategic, onUpdateStrategic }) => (
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
          <p style={{ margin: 0, fontWeight: 500 }}>분석 결과가 승인되었습니다! ✅</p>
          <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
            Market Analyst Report를 기반으로 <strong>Strategic Message</strong>를 추출했습니다.
            아래 결과를 확인해주세요.
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

const GenerationConfigView = ({ onSubmitGeneration, isGenerating }) => (
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
          <p style={{ margin: 0, fontWeight: 500 }}>Strategic Message가 확정되었습니다! ✅</p>
          <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
            맞춤형 카피 생성을 위해 <strong>타겟 국가, 연령대, 페르소나, 스킬셋</strong>을 설정해주세요.
          </p>
        </div>
        <GenerationConfig onSubmit={onSubmitGeneration} isGenerating={isGenerating} />
      </div>
    </div>
);

const CopyResultsView = ({ copyResults, isGenerating, onUpdateCopyResults, onReview }) => (
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
          <p style={{ margin: 0, fontWeight: 500 }}>카피 생성이 완료되었습니다! ✅</p>
          <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
            아래에서 생성된 카피를 확인하고, <strong>Review</strong> 버튼을 눌러 품질 검증을 진행해주세요.
          </p>
        </div>
        <CopyResults results={copyResults} isGenerating={isGenerating} onUpdate={onUpdateCopyResults} onReview={onReview} />
      </div>
    </div>
);


const COUNTRY_META = {
    US: { label: 'USA', flag: '🇺🇸' }, DE: { label: 'Germany', flag: '🇩🇪' },
    GB: { label: 'UK', flag: '🇬🇧' }, FR: { label: 'France', flag: '🇫🇷' },
    IT: { label: 'Italy', flag: '🇮🇹' }, ES: { label: 'Spain', flag: '🇪🇸' },
    IN: { label: 'India', flag: '🇮🇳' }, BR: { label: 'Brazil', flag: '🇧🇷' },
    KR: { label: 'Korea', flag: '🇰🇷' }, AU: { label: 'Australia', flag: '🇦🇺' },
    ID: { label: 'Indonesia', flag: '🇮🇩' }, SA: { label: 'Saudi Arabia', flag: '🇸🇦' },
};

/* ─── Review Results: 국가별 → 카피별 → 스킬별 (접기/펼치기) ─── */

const ReviewBadgeList = ({ icon, label, color, bg, border, items }) => {
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
                    <div key={i} style={{
                        padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem',
                        lineHeight: 1.6, color: COLORS.TEXT_MAIN,
                        backgroundColor: bg, borderLeft: `3px solid ${border}`,
                    }}>
                        {text}
                    </div>
                ))}
            </div>
        </div>
    );
};

const SkillDetailRow = ({ skillId, score, passed, strengths = [], weaknesses = [], improvements = [] }) => {
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
                    <ReviewBadgeList icon="✦" label="강점" color="#16A34A" bg="#F0FDF4" border="#16A34A" items={strengths} />
                    <ReviewBadgeList icon="▲" label="약점" color="#DC2626" bg="#FEF2F2" border="#DC2626" items={weaknesses} />
                    <ReviewBadgeList icon="→" label="보완" color="#2563EB" bg="#EFF6FF" border="#2563EB" items={improvements} />
                    {strengths.length === 0 && weaknesses.length === 0 && improvements.length === 0 && (
                        <div style={{ color: COLORS.TEXT_SUB, fontStyle: 'italic', fontSize: '0.8rem', padding: '4px 0' }}>리뷰 상세 내용 없음</div>
                    )}
                </div>
            )}
        </div>
    );
};

const CopyReviewItem = ({ data }) => {
    const [open, setOpen] = useState(false);
    const { copyKey, skills, avgScore, allPassed, lowestSkill, copyInfo } = data;
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
                        />
                    ))}
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

const ReviewView = ({ enabledSkills, onToggleSkill, onSubmitReview, isReviewing = false, copyResults = [], selectedCopies, onToggleCopy, availableSkills }) => {
    const skillsList = availableSkills || SKILLSETS.map(s => ({ ...s, type: 'builtin', editable: false }));

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
            backgroundColor: type === 'builtin' ? '#EFF6FF' : '#FFF7ED',
            color: type === 'builtin' ? '#2563EB' : '#C2410C',
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
                    <p style={{ margin: 0, fontWeight: 500 }}>카피가 생성되었습니다! ✅</p>
                    <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
                        좌측 패널에서 생성된 카피를 확인하고, 아래 <strong>Review Settings</strong>에서 리뷰 대상 카피와 검증 스킬셋을 선택해주세요.
                    </p>
                </div>
                <div style={styles.container}>
                    <h3 style={styles.header}>
                        <Cpu size={22} color={COLORS.LG_RED} />Review Settings
                    </h3>
                    <p style={styles.subheader}>
                        리뷰할 카피를 선택하고 검증 스킬셋을 설정해주세요. 선택한 카피에 대해 품질과 적합성을 검토합니다.
                    </p>

                    {/* Target Copy */}
                    <div style={styles.sectionTitle}>
                        <Globe size={14} />Target Copy
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

                    {/* Use Skillsets — from API */}
                    <div style={styles.sectionTitle}>
                        <Cpu size={14} />Use Skillsets
                        <span style={{ fontSize: '0.7rem', color: COLORS.TEXT_SUB, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                            ({skillsList.length} available)
                        </span>
                    </div>
                    <div>
                        {skillsList.map(s => (
                            <div key={s.id} style={styles.skillRow}>
                                <div style={styles.skillInfo}>
                                    <p style={styles.skillLabel}>
                                        {s.label}
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
                                    Reviewing...
                                </>
                            ) : (
                                <>
                                    <ArrowRight size={16} />
                                    Submit Review
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

const ReviewResultsView = ({ reviewResults, reviewSummary, copyResults, isReviewing, onSaveExit, onExitWithoutSave, isSaving = false }) => {
    const [showExitConfirm, setShowExitConfirm] = useState(false);
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
                        {isReviewing ? 'Skillset Review를 실행하고 있습니다...' : 'Skillset Review가 완료되었습니다! ✅'}
                    </p>
                    <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
                        {isReviewing
                            ? '각 스킬별 검증 결과가 실시간으로 표시됩니다.'
                            : '아래에서 국가별 · 카피별 리뷰 결과를 확인하세요. 카피를 클릭하면 스킬별 상세 판정을 볼 수 있습니다.'
                        }
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
                        <CheckCircle size={22} color={COLORS.LG_RED} />Review 결과
                        {isReviewing && (
                            <Loader size={16} color={COLORS.LG_RED} style={{ animation: 'spin 1s linear infinite' }} />
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
                                    <CopyReviewItem key={copyData.copyKey} data={copyData} />
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
