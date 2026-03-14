import React from 'react';
import { User, Tag, Shield, BarChart2, SmilePlus, Search, Info, Target, TrendingUp, AlertTriangle, CheckSquare } from 'lucide-react';
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
            boxShadow: `0 4px 12px rgba(0,0,0,0.05)`,
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
            backgroundColor: '#F0F0F0',
            color: COLORS.TEXT_SUB,
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            margin: '0 5px 5px 0'
        },
        primaryBtn: {
          padding: '16px',
          borderRadius: '12px',
          border: 'none',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s ease',
       },
    };

    return (
        <div style={styles.analysisContainer}>
            <h3 style={styles.analysisHeader}><BarChart2 size={22} color={COLORS.LG_RED} />Market Analyst Report</h3>
            <div style={styles.gridContainer}>

                {/* Brief Summary Card */}
                <div style={{...styles.card, gridColumn: 'span 12'}}>
                    <h4 style={styles.cardTitle}><Info size={14}/>Brief Summary & AI Direction</h4>
                    <p style={{margin: 0, fontSize: '0.9rem', color: COLORS.TEXT_SUB, lineHeight: 1.6}}>
                        <strong>Objective:</strong> {analysisResult.briefSummary.objective}<br/>
                        <strong>Challenge:</strong> {analysisResult.briefSummary.coreChallenge}<br/>
                        <strong>AI Direction:</strong> <span style={{color: COLORS.LG_RED, fontWeight: 500}}>{analysisResult.briefSummary.aiDirection}</span>
                    </p>
                </div>

                {/* Persona Card */}
                <div style={{...styles.card, gridColumn: 'span 7'}}>
                    <h4 style={styles.cardTitle}><User size={14}/>Deep-dive Persona</h4>
                    <div style={{display: 'flex', gap: '1.5rem'}}>
                        <img src={analysisResult.persona.avatar} alt="Persona" style={{width: 70, height: 70, borderRadius: '18px'}} />
                        <div style={{flex: 1}}>
                            <p style={{margin: '0 0 10px 0', fontWeight: 700, fontSize: '1.1rem', color: COLORS.TEXT_MAIN}}>{analysisResult.persona.name}</p>
                            <p style={{margin: '0 0 10px 0', fontSize: '0.9rem', color: COLORS.TEXT_SUB}}><strong>Pain Point:</strong> {analysisResult.persona.painPoint}</p>
                            <p style={{margin: '0', fontSize: '0.9rem', color: COLORS.TEXT_SUB}}><strong>Motivation:</strong> {analysisResult.persona.motivation}</p>
                        </div>
                    </div>
                </div>

                {/* Brand Fit Score */}
                 <div style={{...styles.card, gridColumn: 'span 5'}}>
                    <h4 style={styles.cardTitle}><CheckSquare size={14}/>Brand Fit Score</h4>
                    <div style={{textAlign: 'center', margin: 'auto'}}>
                        <p style={{fontSize: '2.5rem', fontWeight: 800, color: COLORS.LG_RED, margin: 0}}>{analysisResult.brandFit.score}%</p>
                        <p style={{margin: '5px 0 0 0', fontSize: '0.8rem', color: COLORS.TEXT_SUB}}>{analysisResult.brandFit.positiveSignals}</p>
                    </div>
                </div>

                {/* Market Opportunity */}
                <div style={{...styles.card, gridColumn: 'span 12'}}>
                    <h4 style={styles.cardTitle}><TrendingUp size={14}/>Market Opportunity & Risk</h4>
                     <p style={{margin: '0 0 10px 0', fontSize: '0.9rem', color: COLORS.TEXT_SUB}}>
                        <strong style={{color: COLORS.SUCCESS}}>Opportunity Gap: </strong> {analysisResult.marketAnalysis.opportunityGap}
                    </p>
                     <p style={{margin: '0', fontSize: '0.9rem', color: COLORS.TEXT_SUB}}>
                        <strong style={{color: '#FF9500'}}>Risk Keyword: </strong> {analysisResult.marketAnalysis.riskKeyword}
                    </p>
                </div>

                {/* Competitive Keywords */}
                <div style={{...styles.card, gridColumn: 'span 6'}}>
                  <h4 style={styles.cardTitle}><Shield size={14}/>Competitive Keywords</h4>
                  <div>
                    {analysisResult.competitiveKeywords.map(kw => (
                      <div key={kw.word} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '10px' }}>
                        <span>{kw.word}</span>
                        <div style={{width: '50%', height: '8px', backgroundColor: '#eee', borderRadius: '4px'}}><div style={{width: `${kw.count}%`, height: '8px', backgroundColor: COLORS.TEXT_SUB, borderRadius: '4px'}}></div></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Keywords */}
                <div style={{...styles.card, gridColumn: 'span 6'}}>
                   <h4 style={styles.cardTitle}><Tag size={14}/>Untapped Keywords</h4>
                   <div>
                      {analysisResult.marketAnalysis.untappedKeywords.map(kw => (
                        <div key={kw} style={{...styles.tag, backgroundColor: '#FFF0F3', color: COLORS.LG_RED, fontWeight: 600, fontSize: '0.85rem' }}>{kw}</div>
                      ))}
                   </div>
                </div>
                
                {/* HITL Action */}
                {!isApproved && (
                    <div style={{...styles.card, gridColumn: 'span 12', backgroundColor: '#FFFBEA', border: '1px solid #FFD6A5'}}>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                            <div>
                                <h4 style={{ ...styles.cardTitle, color: '#D97706' }}><SmilePlus size={14} />Does this analysis align with your vision?</h4>
                                <p style={{margin: 0, fontSize: '0.9rem', color: '#B45309'}}>Approve to proceed to the Copy Generation step, or modify the brief.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button style={{ ...styles.primaryBtn, backgroundColor: COLORS.TEXT_SUB }} onClick={onModify}>Modify Brief</button>
                                <button style={{ ...styles.primaryBtn, backgroundColor: COLORS.SUCCESS }} onClick={onApprove}>Approve & Generate Copy</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisReport;
