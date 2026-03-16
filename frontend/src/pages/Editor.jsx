import React, { useState } from 'react';
import { COLORS } from '../styles/theme';
import WorkflowStepper from '../components/WorkflowStepper';
import BriefingForm from '../components/BriefingForm';
import { InitialView, ResultView } from '../components/EditorViews';

const Editor = () => {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isApproved, setIsApproved] = useState(false);

  const handleStartAnalysis = async (formData) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setIsApproved(false);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/v1/campaigns/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setAnalysisResult(result.data);
      setStep(2);
    } catch (error) {
      console.error('Analysis API call failed:', error);
      alert('Analysis failed. Please check the console for details and ensure the backend server is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprove = () => {
    setIsApproved(true);
    setStep(3);
  };

  const handleModify = () => {
    setAnalysisResult(null);
    setStep(1);
  };

  const styles = {
    editorContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    mainArea: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
    },
    contentArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      backgroundColor: COLORS.BG_GRAY,
    },
  };

  return (
    <div style={styles.editorContainer}>
      <WorkflowStepper currentStep={step} />
      <div style={styles.mainArea}>
        <BriefingForm
          onStartAnalysis={handleStartAnalysis}
          isAnalyzing={isAnalyzing}
          isDisabled={step > 1}
        />
        <div style={styles.contentArea}>
          {!analysisResult ? (
            <InitialView />
          ) : (
            <ResultView
              onApprove={handleApprove}
              onModify={handleModify}
              isApproved={isApproved}
              analysisResult={analysisResult}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
