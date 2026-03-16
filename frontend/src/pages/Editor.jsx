// src/pages/Editor.jsx
import React, { useState } from 'react';
// ... other imports

const Editor = () => {
  const [step, setStep] = useState(1);
  const [editorView, setEditorView] = useState('briefing');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  // ... other states

  const handleStartAnalysis = async (formData) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/campaigns/analyze`, {
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
      setEditorView('analysis_result');

    } catch (error) {
      console.error("Analysis API call failed:", error);
      alert("Analysis failed. Please check the console for details and ensure the backend server is running.");
      setStep(1); // Reset step
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ... rest of the component
};

export default Editor;
