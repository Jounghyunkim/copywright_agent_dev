import React from 'react';
import { User, Tag, Shield, BarChart2, SmilePlus, Info, TrendingUp, CheckSquare, RefreshCw, Heart, Globe, PenTool, Sparkles } from 'lucide-react';
import { COLORS } from '../styles/theme';

const AnalysisReport = ({ onApprove, onModify, isApproved, analysisResult }) => {

    const styles = {
        analysisContainer: {
            padding: '1.5rem',
            borderRadius: '20px',
            backgroundColor: 'rgba(240, 240, 240, 0.5)',
            border: `1px solid ${COLORS.BORDER}`,
            marginTop: '1.5rem',
        },
        analysisHeader: {
            fontSize: '1.1rem',
            fontWeight: 800,
            color: COLORS.TEXT_MAIN,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        gridContainer: {
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '1.5rem',
        },
        card: {
            backgroundColor: COLORS.WHITE,
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: `1px solid ${COLORS.BORDER}`,
            display: 'flex',
            flexDirection: 'column'
        },
        cardTitle: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: COLORS.TEXT_SUB,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '1rem'
        },
        tag: {
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            margin: '0 5px 5px 0'
        },
        bodyText: {
            margin: 0, fontSize: '0.9rem', color: COLORS.TEXT_SUB, lineHeight: 1.6
        },
        label: {
            fontWeight: 700, fontSize: '0.78rem', color: COLORS.TEXT_MAIN, marginBottom: '4px'
        },
        blockquote: {
            margin: '0', padding: '12px 16px', borderLeft: `3px solid ${COLORS.LG_RED}`,
            backgroundColor: '#FFF8FA', borderRadius: '0 10px 10px 0',
            fontSize: '0.95rem', fontStyle: 'italic', lineHeight: 1.7, color: COLORS.TEXT_MAIN,
        },
        doTag: {
            display: 'inline-block', backgroundColor: '#E8F5E9', color: '#2E7D32',
            padding: '5px 12px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, margin: '0 6px 6px 0',
        },
        dontTag: {
            display: 'inline-block', backgroundColor: '#FFEBEE', color: '#C62828',
            padding: '5px 12px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, margin: '0 6px 6px 0',
        },
        narrativeBox: (bg) => ({
            padding: '12px 16px', borderRadius: '12px', backgroundColor: bg,
            fontSize: '0.88rem', lineHeight: 1.6, color: COLORS.TEXT_MAIN,
        }),
        tensionRow: {
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontSize: '0.88rem',
        },
        primaryBtn: {
            padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '1rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)', transition: 'transform 0.2s ease',
        },
    };

    // Safe accessors for new fields with fallbacks
    const r = analysisResult;
    const briefSummary = r.briefSummary || {};
    const persona = r.persona || {};
    const brandFit = r.brandFit || {};
    const marketAnalysis = r.marketAnalysis || {};
    const competitiveKeywords = r.competitiveKeywords || [];
    const categoryNarrative = r.categoryNarrative || {};
    const emotionalJTBD = r.emotionalJTBD || '';
    const culturalTension = r.culturalTension || {};
    const copyImplications = r.copyImplications || {};
    const recommendedKeywords = r.recommendedKeywords || [];

    return (
        <div style={styles.analysisContainer}>
            <h3 style={styles.analysisHeader}><BarChart2 size={22} color={COLORS.LG_RED} />Market Analyst Report</h3>
            <div style={styles.gridContainer}>

                {/* 1. Research Summary & AI Direction */}
                <div style={{...styles.card, gridColumn: 'span 12'}}>
                    <h4 style={styles.cardTitle}><Info size={14}/>Research Summary & AI Direction</h4>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        <p style={styles.bodyText}><strong>Objective:</strong> {briefSummary.objective}</p>
                        <p style={styles.bodyText}><strong>Core Challenge:</strong> {briefSummary.coreChallenge}</p>
                        <p style={styles.bodyText}>
                            <strong>AI Direction:</strong>{' '}
                            <span style={{color: COLORS.LG_RED, fontWeight: 500}}>{briefSummary.aiDirection}</span>
                        </p>
                        {briefSummary.toneRole && (
                            <p style={styles.bodyText}><strong>Tone & Role:</strong> {briefSummary.toneRole}</p>
                        )}
                    </div>
                </div>

                {/* 2. Deep-dive Persona */}
                <div style={{...styles.card, gridColumn: 'span 7'}}>
                    <h4 style={styles.cardTitle}><User size={14}/>Deep-dive Persona</h4>
                    <div style={{display: 'flex', gap: '1.5rem'}}>
                        <img src={persona.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=default`} alt="Persona" style={{width: 70, height: 70, borderRadius: '18px'}} />
                        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            <p style={{margin: 0, fontWeight: 700, fontSize: '1.1rem', color: COLORS.TEXT_MAIN}}>{persona.name}</p>
                            <p style={styles.bodyText}><strong>Belief:</strong> {persona.belief || persona.painPoint}</p>
                            <p style={styles.bodyText}><strong>Frustration:</strong> {persona.frustration || persona.motivation}</p>
                            <p style={styles.bodyText}><strong>Purchase Trigger:</strong> {persona.purchaseTrigger}</p>
                            {persona.emotionalTriggerWords && (
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px'}}>
                                    {persona.emotionalTriggerWords.map(w => (
                                        <span key={w} style={{...styles.tag, backgroundColor: '#FFF0F3', color: COLORS.LG_RED, fontWeight: 600, fontSize: '0.78rem'}}>{w}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Brand Fit Score */}
                <div style={{...styles.card, gridColumn: 'span 5'}}>
                    <h4 style={styles.cardTitle}><CheckSquare size={14}/>Brand Fit Score</h4>
                    <div style={{textAlign: 'center', marginBottom: '1rem'}}>
                        <p style={{fontSize: '2.5rem', fontWeight: 800, color: COLORS.LG_RED, margin: 0}}>{brandFit.score}%</p>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                        <p style={styles.bodyText}><strong>Functional:</strong> {brandFit.functionalFit || brandFit.positiveSignals}</p>
                        <p style={styles.bodyText}><strong>Emotional:</strong> {brandFit.emotionalFit}</p>
                        <p style={styles.bodyText}><strong>Cultural:</strong> {brandFit.culturalFit}</p>
                    </div>
                </div>

                {/* 4. Market Opportunity & Risk */}
                <div style={{...styles.card, gridColumn: 'span 12'}}>
                    <h4 style={styles.cardTitle}><TrendingUp size={14}/>Market Opportunity & Risk</h4>
                    <p style={{...styles.bodyText, marginBottom: '10px'}}>
                        <strong style={{color: COLORS.SUCCESS}}>Opportunity Gap:</strong> {marketAnalysis.opportunityGap}
                    </p>
                    <p style={styles.bodyText}>
                        <strong style={{color: '#FF9500'}}>Risk:</strong> {marketAnalysis.riskKeyword}
                    </p>
                </div>

                {/* 5. Competitive Keywords */}
                <div style={{...styles.card, gridColumn: 'span 6'}}>
                    <h4 style={styles.cardTitle}><Shield size={14}/>Competitive Keywords</h4>
                    <p style={{margin: '0 0 10px 0', fontSize: '0.75rem', color: COLORS.TEXT_SUB}}>Language already owned by competitors — avoid or redefine</p>
                    <div>
                        {competitiveKeywords.map(kw => (
                            <div key={kw.word} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '10px' }}>
                                <span>{kw.word}</span>
                                <div style={{width: '50%', height: '8px', backgroundColor: '#eee', borderRadius: '4px'}}>
                                    <div style={{width: `${kw.count}%`, height: '8px', backgroundColor: COLORS.TEXT_SUB, borderRadius: '4px'}} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. Untapped Keywords */}
                <div style={{...styles.card, gridColumn: 'span 6'}}>
                    <h4 style={styles.cardTitle}><Tag size={14}/>Untapped Keywords</h4>
                    <p style={{margin: '0 0 10px 0', fontSize: '0.75rem', color: COLORS.TEXT_SUB}}>Sensory & emotional territory no one owns yet</p>
                    <div>
                        {(marketAnalysis.untappedKeywords || []).map(kw => (
                            <span key={kw} style={{...styles.tag, backgroundColor: '#FFF0F3', color: COLORS.LG_RED, fontWeight: 600, fontSize: '0.85rem'}}>{kw}</span>
                        ))}
                    </div>
                </div>

                {/* 7. Category Narrative Shift */}
                {categoryNarrative.oldNarrative && (
                    <div style={{...styles.card, gridColumn: 'span 12'}}>
                        <h4 style={styles.cardTitle}><RefreshCw size={14}/>Category Narrative Shift</h4>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center'}}>
                            <div style={styles.narrativeBox('#F5F5F5')}>
                                <p style={{...styles.label, color: COLORS.TEXT_SUB}}>Old Narrative</p>
                                <p style={{...styles.bodyText, fontStyle: 'italic'}}>{categoryNarrative.oldNarrative}</p>
                            </div>
                            <span style={{fontSize: '1.5rem', color: COLORS.LG_RED}}>→</span>
                            <div style={styles.narrativeBox('#FFF0F3')}>
                                <p style={{...styles.label, color: COLORS.LG_RED}}>New Narrative</p>
                                <p style={{...styles.bodyText, fontWeight: 500}}>{categoryNarrative.newNarrative}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 8. Emotional JTBD */}
                {emotionalJTBD && (
                    <div style={{...styles.card, gridColumn: 'span 6'}}>
                        <h4 style={styles.cardTitle}><Heart size={14}/>Emotional Job To Be Done</h4>
                        <div style={styles.blockquote}>
                            "{emotionalJTBD}"
                        </div>
                        <p style={{margin: '10px 0 0 0', fontSize: '0.75rem', color: COLORS.TEXT_SUB}}>This sentence becomes the root of all copy.</p>
                    </div>
                )}

                {/* 9. Cultural Tension Map */}
                {culturalTension.tensions && culturalTension.tensions.length > 0 && (
                    <div style={{...styles.card, gridColumn: 'span 6'}}>
                        <h4 style={styles.cardTitle}><Globe size={14}/>Cultural Tension Map</h4>
                        {culturalTension.tensions.map((t, i) => (
                            <div key={i} style={styles.tensionRow}>
                                <span style={{width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FFF0F3', color: COLORS.LG_RED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0}}>{i+1}</span>
                                <span style={{color: COLORS.TEXT_SUB}}>{t}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 10. Copy Implications & Guardrails */}
                {(copyImplications.doList || copyImplications.dontList) && (
                    <div style={{...styles.card, gridColumn: 'span 12'}}>
                        <h4 style={styles.cardTitle}><PenTool size={14}/>Copy Implications & Guardrails</h4>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                            <div>
                                <p style={{...styles.label, color: COLORS.SUCCESS, marginBottom: '8px'}}>DO</p>
                                {(copyImplications.doList || []).map((item, i) => (
                                    <div key={i} style={styles.doTag}>{item}</div>
                                ))}
                            </div>
                            <div>
                                <p style={{...styles.label, color: '#C62828', marginBottom: '8px'}}>DON'T</p>
                                {(copyImplications.dontList || []).map((item, i) => (
                                    <div key={i} style={styles.dontTag}>{item}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 11. Recommended Keywords */}
                {recommendedKeywords.length > 0 && (
                    <div style={{...styles.card, gridColumn: 'span 12'}}>
                        <h4 style={styles.cardTitle}><Sparkles size={14}/>Recommended Keywords</h4>
                        <div>
                            {recommendedKeywords.map(kw => (
                                <span key={kw} style={{...styles.tag, backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 600, fontSize: '0.85rem'}}>{kw}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* HITL Action */}
                {!isApproved && (
                    <div style={{...styles.card, gridColumn: 'span 12', backgroundColor: '#FFFBEA', border: '1px solid #FFD6A5', textAlign: 'center'}}>
                        <h4 style={{ ...styles.cardTitle, justifyContent: 'center' }}><SmilePlus size={14} />Does this analysis align with your vision?</h4>
                        <p style={{margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: '#B45309'}}>Approve to proceed to the Strategic Message step, or modify the research to re-analyze.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button style={{ ...styles.primaryBtn, flex: 1, backgroundColor: COLORS.WHITE, color: COLORS.LG_RED, border: `1px solid ${COLORS.LG_RED}` }} onClick={onModify}>Modify Research</button>
                            <button style={{ ...styles.primaryBtn, flex: 1, backgroundColor: COLORS.LG_RED, color: COLORS.WHITE }} onClick={onApprove}>Approve & Strategic Message</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisReport;
