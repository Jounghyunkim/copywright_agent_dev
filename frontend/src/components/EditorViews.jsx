import React, { useState } from 'react';
import { Bot, Zap, Cpu, ArrowRight, Loader, Globe } from 'lucide-react';
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

const ReviewView = ({ enabledSkills, onToggleSkill, onSubmitReview, isReviewing = false, copyResults = [], selectedCopies, onToggleCopy }) => {
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
        skillLabel: { fontSize: '0.85rem', fontWeight: 600, color: COLORS.TEXT_MAIN, margin: 0 },
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

                    {/* Use Skillsets */}
                    <div style={styles.sectionTitle}>
                        <Cpu size={14} />Use Skillsets
                    </div>
                    <div>
                        {SKILLSETS.map(s => (
                            <div key={s.id} style={styles.skillRow}>
                                <div style={styles.skillInfo}>
                                    <p style={styles.skillLabel}>{s.label}</p>
                                    <p style={styles.skillDesc}>{s.desc}</p>
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
                                fontWeight: 700, fontSize: '0.95rem', cursor: isReviewing ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                backgroundColor: COLORS.LG_RED, color: COLORS.WHITE,
                                boxShadow: '0 8px 20px rgba(165, 0, 52, 0.25)',
                                transition: 'all 0.2s ease', fontFamily: 'inherit',
                                opacity: isReviewing ? 0.7 : 1,
                            }}
                            onClick={onSubmitReview}
                            disabled={isReviewing}
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

export { InitialView, ResultView, StrategicMessageView, GenerationConfigView, ReviewView };
