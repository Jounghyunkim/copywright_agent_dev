import React, { useState } from 'react';
import BriefingForm from '../components/BriefingForm';
import WorkflowStepper from '../components/WorkflowStepper';
import SidebarToggle from '../components/SidebarToggle';
import { InitialView, ResultView } from '../components/EditorViews';
import { mockAnalysisResult } from '../data/mockData'; // Assuming mock data is moved

const Editor = () => {
  const [step, setStep] = useState(1);
  const [editorView, setEditorView] = useState('briefing');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisApproved, setAnalysisApproved] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setStep(2);
      setEditorView('analysis_result');
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleModifyBrief = () => {
    setEditorView('briefing');
    setStep(1);
    setAnalysisApproved(false);
    setIsSidebarCollapsed(false);
  };

  const handleApproveAnalysis = () => {
    setAnalysisApproved(true);
    setTimeout(() => setStep(3), 1000);
  };

  const styles = {
    main: { display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' },
    contentArea: { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' },
    chatContainer: { flex: 1, overflowY: 'auto', padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' },
  };

  return (
    <div style={styles.main}>
      <BriefingForm
        isCollapsed={isSidebarCollapsed}
        onStartAnalysis={handleStartAnalysis}
        isAnalyzing={isAnalyzing}
        isDisabled={editorView === 'analysis_result'}
      />
      <SidebarToggle
        isCollapsed={isSidebarCollapsed}
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        show={editorView === 'analysis_result'}
      />
      <div style={styles.contentArea}>
        <WorkflowStepper currentStep={step} />
        <div style={styles.chatContainer}>
          {editorView === 'briefing' ? (
            <InitialView />
          ) : (
            <ResultView
              onApprove={handleApproveAnalysis}
              onModify={handleModifyBrief}
              isApproved={analysisApproved}
              analysisResult={mockAnalysisResult}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
