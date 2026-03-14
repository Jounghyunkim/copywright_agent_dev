import React, { useState } from 'react';
import { Bot, Zap } from 'lucide-react';
import BriefingForm from '../components/BriefingForm';
import WorkflowStepper from '../components/WorkflowStepper';
import { COLORS } from '../styles/theme';

const Editor = () => {
  const [step, setStep] = useState(1);
  
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
    }
  };

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
                  <p style={{ margin: 0, fontWeight: 500 }}>좋은 아침입니다, 정현님! 👋</p>
                  <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
                    제품 정보와 타겟 국가를 입력해 주시면, **RAG 기반의 시장 데이터**를 분석하여 
                    해당 지역에 가장 매력적으로 다가갈 카피 전략을 수립하겠습니다.
                  </p>
                </div>
                 <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: COLORS.LG_RED, fontWeight: 700, cursor: 'pointer' }}>LG Brand Guidelines Loaded</div>
                  <div style={{ fontSize: '0.75rem', color: COLORS.TEXT_SUB }}>•</div>
                  <div style={{ fontSize: '0.75rem', color: COLORS.TEXT_SUB }}>Global Ad Legacy Sync Ready</div>
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
        </div>
      </div>
    </div>
  );
};

export default Editor;
