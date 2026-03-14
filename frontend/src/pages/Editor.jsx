import React, { useState } from 'react';
import BriefingForm from '../components/BriefingForm';
import WorkflowStepper from '../components/WorkflowStepper';
import AnalysisReport from '../components/AnalysisReport'; // Import the new component
import { Bot, Zap } from 'lucide-react';
import { COLORS } from '../styles/theme';

const Editor = () => {
  const [step, setStep] = useState(1); // For the stepper
  const [editorView, setEditorView] = useState('briefing'); // 'briefing', 'analysis_result'
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate API call for analysis
    setTimeout(() => {
      setStep(2);
      setEditorView('analysis_result');
      setIsAnalyzing(false);
    }, 1500); // 1.5 second delay to simulate work
  };

  const styles = {
    main: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
    },
    contentArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    },
    chatContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '3rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
    },
    botMessage: {
      display: 'flex',
      gap: '16px',
      maxWidth: '85%',
    },
    messageBubble: {
      padding: '1.2rem 1.5rem',
      borderRadius: '20px',
      borderTopLeftRadius: '4px',
      backgroundColor: COLORS.WHITE,
      boxShadow: `0 4px 15px ${COLORS.SHADOW}`,
      lineHeight: 1.6,
      fontSize: '1rem',
    },
  };

  const InitialView = () => (
    <>
      <div style={styles.botMessage}>
        <div style={{...}}> {/* Bot Icon */}</div>
        <div>
          <div style={styles.messageBubble}>
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

  const ResultView = () => (
     <div style={styles.botMessage}>
        <div style={{...}}> {/* Bot Icon */}</div>
        <div>
          <div style={styles.messageBubble}>
            <p style={{ margin: 0, fontWeight: 500 }}>브리핑을 접수했습니다, 정현님! 🚀</p>
            <p style={{ margin: '8px 0 0 0', color: COLORS.TEXT_SUB, fontSize: '0.9rem' }}>
              **Market Analyst Agent**가 RAG 기반으로 타겟 시장을 분석하여 핵심 인사이트를 도출했습니다.
              아래 리포트를 검토하시고 다음 단계를 승인해주세요.
            </p>
          </div>
          <AnalysisReport onApprove={() => setStep(3)} onModify={() => setEditorView('briefing')} />
        </div>
      </div>
  );

  return (
    <div style={styles.main}>
      <BriefingForm onStartAnalysis={handleStartAnalysis} isAnalyzing={isAnalyzing} />
      <div style={styles.contentArea}>
        <WorkflowStepper currentStep={step} />
        <div style={styles.chatContainer}>
          {editorView === 'briefing' ? <InitialView /> : <ResultView />}
        </div>
      </div>
    </div>
  );
};

export default Editor;
