import React, { useState } from 'react';
import BriefingForm from '../components/BriefingForm';
import WorkflowStepper from '../components/WorkflowStepper';
import AnalysisReport from '../components/AnalysisReport';
import { Bot, Zap, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { COLORS } from '../styles/theme';

const Editor = () => {
  const [step, setStep] = useState(1);
  const [editorView, setEditorView] = useState('briefing');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisApproved, setAnalysisApproved] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // ... (rest of the state and mock data)
  const mockAnalysisResult = {
    briefSummary: {
      objective: "Strengthen brand's emotional story and encourage organic sharing",
      coreChallenge: "Connecting 'Life's Good' philosophy with Gen Z's daily struggles",
      aiDirection: "Focus on 'Micro-moments of Brave Optimism'"
    },
    persona: {
      avatar: "https://i.pravatar.cc/150?u=chloe",
      name: "Chloe, the Conscious Creator",
      painPoint: "Feels overwhelmed by toxic positivity; seeks authentic motivation.",
      motivation: "Wants technology to support her well-being seamlessly."
    },
    brandFit: {
      score: 92,
      positiveSignals: "High alignment with LG's core philosophy"
    },
    marketAnalysis: {
      opportunityGap: "Lack of relatable, imperfect tech stories",
      riskKeyword: "Overly corporate tone",
      untappedKeywords: ["Mindful Technology", "Effortless Living", "Brave Optimism"]
    },
    competitiveKeywords: [
      { word: "Eco-Friendly", count: 85 },
      { word: "Smart Home", count: 78 },
      { word: "Sleek Design", count: 72 },
      { word: "Performance", count: 65 },
      { word: "Energy Saving", count: 61 }
    ]
  };


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
    setIsSidebarCollapsed(false); // Reset sidebar state
  };

  const handleApproveAnalysis = () => {
    setAnalysisApproved(true);
    setTimeout(() => {
        setStep(3);
    }, 1000);
  };

  const styles = {
    main: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
      position: 'relative', // For absolute positioning of the toggle button
    },
    contentArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    },
    sidebarToggleButton: {
        position: 'absolute',
        left: isSidebarCollapsed ? '10px' : '400px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        height: '40px',
        width: '24px',
        backgroundColor: COLORS.WHITE,
        border: `1px solid ${COLORS.BORDER}`,
        borderLeft: 'none',
        borderTopRightRadius: '8px',
        borderBottomRightRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '4px 0 10px rgba(0,0,0,0.05)',
        transition: 'left 0.3s ease-in-out',
    }
  };
  
  // ... (rest of the component logic)

  return (
    <div style={styles.main}>
      <BriefingForm 
        isCollapsed={isSidebarCollapsed}
        onStartAnalysis={handleStartAnalysis} 
        isAnalyzing={isAnalyzing} 
        isDisabled={editorView === 'analysis_result'}
      />

      {editorView === 'analysis_result' && (
        <button style={styles.sidebarToggleButton} onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
          {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      )}

      <div style={styles.contentArea}>
        {/* ... */}
      </div>
    </div>
  );
};
