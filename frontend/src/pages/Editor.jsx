import React, { useState } from 'react';
import { Bot, Zap, User, Tag, Shield, BarChart2, Briefcase, SmilePlus } from 'lucide-react';
import BriefingForm from '../components/BriefingForm';
import WorkflowStepper from '../components/WorkflowStepper';
import { COLORS } from '../styles/theme';

const Editor = () => {
  const [step, setStep] = useState(2); // Start at step 2 to show the analysis results
  
  // Mock Data for Visualization
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
     main: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden'
    },
    contentArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    },
    chatContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '3rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    },
    botMessage: {
      display: 'flex',
      gap: '16px',
      maxWidth: '85%'
    },
    messageBubble: {
      padding: '1.2rem 1.5rem',
      borderRadius: '20px',
      borderTopLeftRadius: '4px',
      backgroundColor: COLORS.WHITE,
      boxShadow: `0 4px 15px ${COLORS.SHADOW}`,
      lineHeight: 1.6,
      fontSize: '1rem'
    },
    // New styles for visualization
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
    }
  };

  const AnalysisReport = () => (
    <div style={styles.analysisContainer}>
      <h3 style={styles.analysisHeader}><BarChart2 size={20} color={COLORS.LG_RED}/>Market Analyst Agent's Report</h3>
      <div style={styles.gridContainer}>
        {/* Persona Card */}
        <div style={{...styles.card, ...styles.personaCard}}>
          <img src={analysisResult.persona.avatar} alt="Persona" style={{width: 80, height: 80, borderRadius: '50%'}} />
          <div style={{flex: 1}}>
            <h4 style={styles.cardTitle}><User size={14}/>Target Persona</h4>
            <p style={{margin: '0 0 10px 0', fontWeight: 700, color: COLORS.TEXT_MAIN}}>{analysisResult.persona.name}</p>
            <p style={{margin: '0 0 10px 0', fontSize: '0.9rem', color: COLORS.TEXT_SUB}}>{analysisResult.persona.details}</p>
            <div>{analysisResult.persona.keywords.map(k => <span key={k} style={styles.tag}>{k}</span>)}</div>
          </div>
        </div>
        {/* Competitive Keywords */}
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
        {/* Recommended Keywords */}
        <div style={styles.card}>
           <h4 style={styles.cardTitle}><Tag size={14}/>Recommended Keywords</h4>
           <div>
              {analysisResult.recommendedKeywords.map(kw => (
                <div key={kw} style={{...styles.tag, backgroundColor: '#FFF0F3', color: COLORS.LG_RED, fontWeight: 600 }}>{kw}</div>
              ))}
           </div>
        </div>
         {/* HITL Action */}
        <div style={{...styles.card, gridColumn: '1 / 4', textAlign: 'center' }}>
            <h4 style={{ ...styles.cardTitle, justifyContent: 'center' }}><SmilePlus size={14}/>Does this analysis align with your vision?</h4>
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                <button style={{...styles.primaryBtn, padding: '10px 20px', fontSize: '0.9rem', backgroundColor: COLORS.SUCCESS}} onClick={() => setStep(3)}>Approve & Generate Copy</button>
                <button style={{...styles.primaryBtn, padding: '10px 20px', fontSize: '0.9rem', backgroundColor: COLORS.TEXT_SUB}}>Modify Brief</button>
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.main}>
      <BriefingForm onStartAnalysis={() => setStep(2)} />
      
      <div style={styles.contentArea}>
        <WorkflowStepper currentStep={step} />
        
        <div style={styles.chatContainer}>
          <div style={styles.botMessage}>
             <div style={{ 
                width: '40px', height: '40px', borderRadius: '14px', backgroundColor: COLORS.LG_RED,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.WHITE,
                boxShadow: '0 4px 10px rgba(165, 0, 52, 0.2)'
              }}>
                <Bot size={22} />
              </div>
              <div>
                <div style={styles.messageBubble}>
                  <p style={{ margin: 0, fontWeight: 500 }}>브리핑을 접수했습니다, 정현님! 🚀</p>
                  <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
                    **Market Analyst Agent**가 RAG 기반으로 타겟 시장을 분석하여 핵심 인사이트를 도출했습니다.
                    아래 리포트를 검토하시고 다음 단계를 승인해주세요.
                  </p>
                </div>
                <AnalysisReport />
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
