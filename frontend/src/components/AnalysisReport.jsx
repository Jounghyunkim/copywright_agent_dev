import React from 'react';
import { User, Tag, Shield, BarChart2, SmilePlus, Search } from 'lucide-react';
import { COLORS } from '../styles/theme';

const AnalysisReport = ({ onApprove, onModify }) => {
    // This is the mock data from the previous step
    const analysisResult = {
        persona: {
            name: 'Chloe, the Conscious Creator',
            avatar: 'https://i.pravatar.cc/150?u=chloe',
            details: 'A 28-year-old graphic designer in Berlin. Values sustainability, minimalist aesthetics, and technology that seamlessly integrates into her life. Active on Instagram and Pinterest.',
            keywords: ['#SustainableLiving', '#MinimalistTech', '#WorkFromHome', '#DigitalNomad'],
        },
        competitiveKeywords: [
            { word: 'Eco-Friendly', count: 85 },
            { word: 'Smart Home', count: 78 },
            { word: 'Sleek Design', count: 72 },
            { word: 'Performance', count: 65 },
            { word: 'Energy Saving', count: 61 },
        ],
        recommendedKeywords: [
            'Mindful Technology',
            'Effortless Living',
            'Designed for you',
            'Brave Optimism',
            '#LifesGood'
        ]
    };

    const styles = {
        analysisContainer: {
            padding: '1.2rem 1.5rem',
            borderRadius: '20px',
            backgroundColor: 'rgba(240, 240, 240, 0.5)',
            border: `1px solid ${COLORS.BORDER}`,
            marginTop: '1rem',
        },
        analysisHeader: {
            fontSize: '1rem',
            fontWeight: 700,
            color: COLORS.TEXT_MAIN,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        gridContainer: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
        },
        card: {
            backgroundColor: COLORS.WHITE,
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: `0 2px 8px rgba(0,0,0,0.05)`,
            border: `1px solid ${COLORS.BORDER}`
        },
        cardTitle: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: COLORS.TEXT_SUB,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '1rem'
        },
        personaCard: {
            gridColumn: '1 / 4',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem'
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
          backgroundColor: COLORS.LG_RED,
          color: COLORS.WHITE,
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
          boxShadow: '0 8px 20px rgba(165, 0, 52, 0.15)',
       },
    };

    return (
        <div style={styles.analysisContainer}>
            <h3 style={styles.analysisHeader}><BarChart2 size={20} color={COLORS.LG_RED} />Market Analyst Agent's Report</h3>
            <div style={styles.gridContainer}>
                {/* Cards here */}
                <div style={{...styles.card, ...styles.personaCard}}>
                  <img src={analysisResult.persona.avatar} alt="Persona" style={{width: 80, height: 80, borderRadius: '50%'}} />
                  <div style={{flex: 1}}>
                    <h4 style={styles.cardTitle}><User size={14}/>Target Persona</h4>
                    <p style={{margin: '0 0 10px 0', fontWeight: 700, color: COLORS.TEXT_MAIN}}>{analysisResult.persona.name}</p>
                    <p style={{margin: '0 0 10px 0', fontSize: '0.9rem', color: COLORS.TEXT_SUB}}>{analysisResult.persona.details}</p>
                    <div>{analysisResult.persona.keywords.map(k => <span key={k} style={styles.tag}>{k}</span>)}</div>
                  </div>
                </div>
                <div style={styles.card}>
                  <h4 style={styles.cardTitle}><Shield size={14}/>Competitive Keywords</h4>
                  <div>
                    {analysisResult.competitiveKeywords.map(kw => (
                      <div key={kw.word} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                        <span>{kw.word}</span>
                        <span style={{ fontWeight: 600, color: COLORS.TEXT_SUB }}>{kw.count}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={styles.card}>
                   <h4 style={styles.cardTitle}><Tag size={14}/>Recommended Keywords</h4>
                   <div>
                      {analysisResult.recommendedKeywords.map(kw => (
                        <div key={kw} style={{...styles.tag, backgroundColor: '#FFF0F3', color: COLORS.LG_RED, fontWeight: 600 }}>{kw}</div>
                      ))}
                   </div>
                </div>
                <div style={{ ...styles.card, gridColumn: '1 / 4', textAlign: 'center' }}>
                    <h4 style={{ ...styles.cardTitle, justifyContent: 'center' }}><SmilePlus size={14} />Does this analysis align with your vision?</h4>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button style={{ ...styles.primaryBtn, padding: '10px 20px', fontSize: '0.9rem', backgroundColor: COLORS.SUCCESS }} onClick={onApprove}>Approve & Generate Copy</button>
                        <button style={{ ...styles.primaryBtn, padding: '10px 20px', fontSize: '0.9rem', backgroundColor: COLORS.TEXT_SUB }} onClick={onModify}>Modify Brief</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisReport;
