import React, { useState } from 'react';
import { Bot, Zap, Cpu, ArrowRight, Loader, Globe, CheckCircle, XCircle, AlertTriangle, Lock, Pencil, Trash2 } from 'lucide-react';
import { COLORS } from '../styles/theme';
import AnalysisReport from './AnalysisReport';
import StrategicMessage from './StrategicMessage';
import GenerationConfig, { SKILLSETS } from './GenerationConfig';
import CopyResults from './CopyResults';

const InitialView = () => (
    <>
      <div style={{ display: 'flex', gap: '16px', maxWidth: '85%' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '14px', backgroundColor: COLORS.LG_RED,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.WHITE,
          boxShadow: '0 4px 10px rgba(165, 0, 52, 0.2)', flexShrink: 0
        }}>
          <Bot size={22} />
        </div>
        <div>
          <div style={{
            padding: '1.2rem 1.5rem', borderRadius: '20px', borderTopLeftRadius: '4px',
            backgroundColor: COLORS.WHITE, boxShadow: `0 4px 15px ${'rgba(0, 0, 0, 0.08)'}`,
            lineHeight: 1.6, fontSize: '1rem'
          }}>
            <p style={{ margin: 0, fontWeight: 500 }}>안녕하세요, 정현님! 👋</p>
            <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
              좌측 패널에 캠페인 정보를 입력하고 분석을 시작해주세요.
            </p>
          </div>
        </div>
      </div>
       <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.3 }}>
          <div style={{ padding: '30px', borderRadius: '50%', border: `2px dashed ${COLORS.TEXT_SUB}`, marginBottom: '1.5rem' }}>
            <Zap size={64} color={COLORS.TEXT_SUB} />
          </div>
          <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Ready to Create</p>
          <p style={{ fontSize: '0.9rem' }}>Fill out the briefing to activate the Multi-Agent engine.</p>
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

const GenerationConfigView = ({ onSubmitGeneration, copyResults, isGenerating, onUpdateCopyResults, onReview }) => (
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

const ReviewResultCard = ({ result }) => {
    const severityColor = { high: '#DC2626', medium: '#D97706', low: '#2563EB' };
    return (
        <div style={{
            padding: '12px 14px', borderRadius: '12px', marginBottom: '8px',
            border: `1px solid ${result.passed ? '#BBF7D0' : '#FECACA'}`,
            backgroundColor: result.passed ? '#F0FDF4' : '#FEF2F2',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {result.passed
                    ? <CheckCircle size={16} color="#16A34A" />
                    : <XCircle size={16} color="#DC2626" />
                }
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: COLORS.TEXT_MAIN }}>
                    {result.skillId}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                    backgroundColor: result.passed ? '#DCFCE7' : '#FEE2E2',
                    color: result.passed ? '#16A34A' : '#DC2626',
                }}>
                    {result.score}/100
                </span>
                <span style={{ fontSize: '0.72rem', color: COLORS.TEXT_SUB, marginLeft: 'auto' }}>
                    {result.targetCopyKey} · {result.executionMs}ms
                </span>
            </div>
            {result.findings?.length > 0 && (
                <div style={{ marginTop: '6px' }}>
                    {result.findings.map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: '4px' }}>
                            <AlertTriangle size={12} color={severityColor[f.severity] || '#6B7280'} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.78rem', color: COLORS.TEXT_MAIN }}>
                                <span style={{ fontWeight: 600, color: severityColor[f.severity] }}>[{f.severity}]</span> {f.message}
                                {f.location && <span style={{ color: COLORS.TEXT_SUB }}> ({f.location})</span>}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            {result.suggestions?.length > 0 && (
                <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #E5E7EB' }}>
                    {result.suggestions.map((s, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                            <span style={{ color: '#DC2626', textDecoration: 'line-through' }}>{s.original}</span>
                            {' → '}
                            <span style={{ color: '#16A34A', fontWeight: 600 }}>{s.suggested}</span>
                            {s.reason && <span style={{ color: COLORS.TEXT_SUB }}> ({s.reason})</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ReviewSummaryCard = ({ summary }) => (
    <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
        padding: '16px', borderRadius: '16px', marginTop: '1rem',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    }}>
        {[
            { label: 'Total Checks', value: summary.total, color: '#93C5FD' },
            { label: 'Passed', value: summary.passed, color: '#86EFAC' },
            { label: 'Avg Score', value: summary.avgScore, color: '#FCD34D' },
        ].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>{item.label}</div>
            </div>
        ))}
    </div>
);

const ReviewView = ({ enabledSkills, onToggleSkill, onSubmitReview, isReviewing = false, copyResults = [], selectedCopies, onToggleCopy, reviewResults, reviewSummary, availableSkills }) => {
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

    const hasResults = reviewResults && reviewResults.length > 0;

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

                {/* Review Results */}
                {(hasResults || isReviewing) && (
                    <div style={{ ...styles.container, marginTop: '1rem' }}>
                        <h3 style={styles.header}>
                            <CheckCircle size={22} color={COLORS.LG_RED} />Review Results
                            {isReviewing && (
                                <Loader size={16} color={COLORS.LG_RED} style={{ animation: 'spin 1s linear infinite' }} />
                            )}
                        </h3>

                        {reviewSummary && <ReviewSummaryCard summary={reviewSummary} />}

                        <div style={{ marginTop: '1rem' }}>
                            {(reviewResults || []).map((r, i) => (
                                <ReviewResultCard key={i} result={r} />
                            ))}
                        </div>

                        {isReviewing && (!reviewResults || reviewResults.length === 0) && (
                            <div style={{ textAlign: 'center', padding: '2rem', color: COLORS.TEXT_SUB }}>
                                <Loader size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>스킬별 검증을 실행하고 있습니다...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export { InitialView, ResultView, StrategicMessageView, GenerationConfigView, ReviewView };
