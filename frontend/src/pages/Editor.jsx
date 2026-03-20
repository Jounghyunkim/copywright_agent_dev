import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Loader, ChevronDown, ChevronRight, FileText, BarChart2, MessageSquareText, Globe } from 'lucide-react';
import { COLORS } from '../styles/theme';
import WorkflowStepper from '../components/WorkflowStepper';
import BriefingForm, { PreviewBody } from '../components/BriefingForm';
import { InitialView, ResultView, StrategicMessageView, GenerationConfigView, ReviewView } from '../components/EditorViews';
import CopyResults from '../components/CopyResults';
import AnalysisReport from '../components/AnalysisReport';
import StrategicMessage from '../components/StrategicMessage';

const MIN_PANEL_WIDTH = 320;

const CollapsibleSection = ({ icon, title, badge, collapsed, onToggle, children }) => (
  <div style={{ backgroundColor: COLORS.WHITE, borderBottom: `1px solid ${COLORS.BORDER}` }}>
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '1rem 1.5rem', cursor: 'pointer', userSelect: 'none',
      }}
    >
      {collapsed ? <ChevronRight size={16} color={COLORS.TEXT_SUB} /> : <ChevronDown size={16} color={COLORS.TEXT_SUB} />}
      {icon}
      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: COLORS.TEXT_MAIN }}>{title}</span>
      {badge && (
        <span style={{
          marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 600,
          padding: '2px 8px', borderRadius: '6px',
          backgroundColor: '#E8F5E9', color: '#2E7D32',
        }}>
          {badge}
        </span>
      )}
    </div>
    {!collapsed && children}
  </div>
);

const Editor = () => {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [leftRatio, setLeftRatio] = useState(0.4);
  const [isDragging, setIsDragging] = useState(false);
  const [submittedBrief, setSubmittedBrief] = useState(null);
  const [isBriefCollapsed, setIsBriefCollapsed] = useState(true);
  const [isReportCollapsed, setIsReportCollapsed] = useState(false);
  const [isStrategicCollapsed, setIsStrategicCollapsed] = useState(false);
  const [strategicData, setStrategicData] = useState(null);
  const [isStrategicLoading, setIsStrategicLoading] = useState(false);
  const [isStrategicApproved, setIsStrategicApproved] = useState(false);
  const [copyResults, setCopyResults] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopyResultsCollapsed, setIsCopyResultsCollapsed] = useState(false);
  const [reviewSkills, setReviewSkills] = useState(['brand-lexicon-check', 'cultural-sensitivity-check']);
  const [selectedCopies, setSelectedCopies] = useState(new Set());
  const [analysisProgress, setAnalysisProgress] = useState([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResults, setReviewResults] = useState(null);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [availableSkills, setAvailableSkills] = useState(null);
  const messagesEndRef = useRef(null);
  const mainAreaRef = useRef(null);

  const addToTimeline = useCallback((item) => {
    setTimeline(prev => [...prev, item]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline, isAnalyzing, isStrategicLoading, isChatLoading]);

  // --- Drag resize logic ---
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const container = mainAreaRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const totalWidth = rect.width;
      const ratio = Math.max(MIN_PANEL_WIDTH / totalWidth, Math.min(x / totalWidth, 1 - MIN_PANEL_WIDTH / totalWidth));
      setLeftRatio(ratio);
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // --- Handlers ---
  const handleStartAnalysis = async (formData) => {
    setSubmittedBrief(formData);
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setIsApproved(false);
    setAnalysisProgress([]);
    addToTimeline({ type: 'analysis-progress' });

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

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;

          try {
            const event = JSON.parse(raw);
            if (event.type === 'progress') {
              setAnalysisProgress(prev => [...prev, event.message]);
            } else if (event.type === 'result') {
              setAnalysisResult(event.data);
              setAnalysisProgress(prev => [...prev, 'Analysis completed successfully.']);
              addToTimeline({ type: 'analysis-result' });
              setStep(2);
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch (parseErr) {
            if (parseErr.message !== raw) console.warn('SSE parse error:', parseErr);
          }
        }
      }
    } catch (error) {
      console.error('Analysis API call failed:', error);
      setAnalysisProgress(prev => [...prev, `Error: ${error.message}`]);
      alert('Analysis failed. Please check the console for details and ensure the backend server is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    setIsApproved(true);
    setStep(3);
    setIsBriefCollapsed(true);
    addToTimeline({ type: 'strategic-message' });
    setIsStrategicLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/v1/campaigns/strategic-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: submittedBrief,
          analysisReport: analysisResult,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setStrategicData(result.data);
    } catch (error) {
      console.error('Strategic message extraction failed:', error);
      alert('Strategic message 추출에 실패했습니다. 백엔드 서버를 확인해주세요.');
    } finally {
      setIsStrategicLoading(false);
    }
  };

  const handleToggleBriefCollapse = () => {
    setIsBriefCollapsed(prev => !prev);
  };

  const handleModifyStrategic = () => {
    setStrategicData(null);
    setIsStrategicApproved(false);
    setIsApproved(false);
    setTimeline(prev => {
      const idx = prev.findIndex(item => item.type === 'strategic-message');
      return idx >= 0 ? prev.slice(0, idx) : prev;
    });
    setStep(2);
  };

  const handleApproveStrategic = () => {
    setIsStrategicApproved(true);
    setIsReportCollapsed(true);
    addToTimeline({ type: 'generation-config' });
    setStep(4);
  };

  const handleSubmitGeneration = async (config) => {
    setIsGenerating(true);
    setCopyResults(null);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/v1/campaigns/generate-copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: submittedBrief,
          analysisReport: analysisResult,
          strategicMessage: strategicData,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setCopyResults(result.data);
    } catch (error) {
      console.error('Copy generation failed:', error);
      alert('카피 생성에 실패했습니다. 백엔드 서버를 확인해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReview = () => {
    // Select all copies by default
    const allKeys = new Set();
    if (copyResults) {
      copyResults.forEach(r => {
        const copies = r.copies || [r];
        copies.forEach((_, idx) => allKeys.add(`${r.countryCode}-${idx}`));
      });
    }
    setSelectedCopies(allKeys);
    addToTimeline({ type: 'review' });
    setIsStrategicCollapsed(true);
    setStep(5);
  };

  const handleToggleReviewSkill = (id) => {
    setReviewSkills(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleToggleCopy = (copyKey) => {
    setSelectedCopies(prev => {
      const next = new Set(prev);
      if (next.has(copyKey)) next.delete(copyKey);
      else next.add(copyKey);
      return next;
    });
  };

  // --- Load skills from API ---
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${apiBase}/api/v1/skills`);
        if (res.ok) {
          const data = await res.json();
          setAvailableSkills(data.skills);
        }
      } catch (e) {
        console.error('Failed to load skills:', e);
      }
    };
    fetchSkills();
  }, []);

  const handleSubmitReview = async () => {
    if (!copyResults || selectedCopies.size === 0 || reviewSkills.length === 0) return;
    setIsReviewing(true);
    setReviewResults([]);
    setReviewSummary(null);

    // Build selectedCopies payload
    const copiesPayload = [];
    copyResults.forEach(r => {
      const copies = r.copies || [r];
      copies.forEach((copy, idx) => {
        const key = `${r.countryCode}-${idx}`;
        if (selectedCopies.has(key)) {
          copiesPayload.push({ key, countryCode: r.countryCode, copyData: copy });
        }
      });
    });

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/v1/campaigns/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: submittedBrief,
          analysisReport: analysisResult,
          strategicMessage: strategicData,
          selectedCopies: copiesPayload,
          enabledSkills: reviewSkills,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            const event = JSON.parse(raw);
            if (event.type === 'skill_completed') {
              setReviewResults(prev => [...prev, event]);
            } else if (event.type === 'review_done') {
              setReviewSummary(event.summary);
            } else if (event.type === 'error') {
              console.error('Review error:', event.message);
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      }
    } catch (error) {
      console.error('Review failed:', error);
      alert('리뷰 실행에 실패했습니다. 백엔드 서버를 확인해주세요.');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleModify = () => {
    setAnalysisResult(null);
    setSubmittedBrief(null);
    setStrategicData(null);
    setIsBriefCollapsed(true);
    setIsStrategicApproved(false);
    setIsApproved(false);
    setAnalysisProgress([]);
    setTimeline(prev => {
      const idx = prev.findIndex(item => item.type === 'analysis-progress');
      return idx >= 0 ? prev.slice(0, idx) : prev;
    });
    setStep(1);
  };

  const handleGuideSelect = (guideInfo) => {
    const guideMessage = `[${guideInfo.title}] 작성 가이드\n\n${guideInfo.guide}`;
    addToTimeline({ type: 'chat-assistant', content: guideMessage });
  };

  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || isChatLoading) return;

    // Build chat history from timeline before adding new message
    const chatHistory = [
      ...timeline
        .filter(item => item.type === 'chat-user' || item.type === 'chat-assistant')
        .map(item => ({ role: item.type === 'chat-user' ? 'user' : 'assistant', content: item.content })),
      { role: 'user', content: text },
    ];

    addToTimeline({ type: 'chat-user', content: text });
    setChatInput('');
    setIsChatLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/v1/campaigns/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      addToTimeline({ type: 'chat-assistant', content: result.reply });
    } catch (error) {
      console.error('Chat API call failed:', error);
      addToTimeline({ type: 'chat-assistant', content: '죄송합니다. 응답 중 오류가 발생했습니다. 다시 시도해 주세요.' });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  // --- Styles ---
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
      position: 'relative',
    },
    leftPanel: {
      width: `${leftRatio * 100}%`,
      flexShrink: 0,
      overflow: 'hidden',
      borderRight: `1px solid ${COLORS.BORDER}`,
    },
    divider: {
      width: '6px',
      cursor: 'col-resize',
      backgroundColor: isDragging ? COLORS.LG_RED : 'transparent',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
      transition: isDragging ? 'none' : 'background-color 0.2s ease',
    },
    rightPanel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: COLORS.BG_GRAY,
      minWidth: 0,
    },
    messagesArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },
    userBubble: {
      display: 'flex',
      justifyContent: 'flex-end',
    },
    userBubbleContent: {
      backgroundColor: COLORS.LG_RED,
      color: COLORS.WHITE,
      padding: '10px 16px',
      borderRadius: '18px',
      borderBottomRightRadius: '4px',
      maxWidth: '70%',
      fontSize: '0.9rem',
      lineHeight: 1.5,
      whiteSpace: 'pre-wrap',
    },
    aiBubbleRow: {
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
      maxWidth: '85%',
    },
    aiAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '12px',
      backgroundColor: COLORS.LG_RED,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: COLORS.WHITE,
      flexShrink: 0,
      boxShadow: '0 4px 10px rgba(165, 0, 52, 0.2)',
    },
    aiBubbleContent: {
      backgroundColor: COLORS.WHITE,
      padding: '10px 16px',
      borderRadius: '18px',
      borderTopLeftRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      fontSize: '0.9rem',
      lineHeight: 1.6,
      color: COLORS.TEXT_MAIN,
      whiteSpace: 'pre-wrap',
    },
    loadingDots: {
      display: 'flex',
      gap: '5px',
      alignItems: 'center',
      padding: '4px 0',
    },
    chatInputArea: {
      padding: '1rem 1.5rem',
      backgroundColor: COLORS.WHITE,
      borderTop: `1px solid ${COLORS.BORDER}`,
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-end',
    },
    chatInput: {
      flex: 1,
      padding: '10px 14px',
      borderRadius: '14px',
      border: `1px solid ${COLORS.BORDER}`,
      fontSize: '0.9rem',
      outline: 'none',
      resize: 'none',
      fontFamily: 'inherit',
      lineHeight: 1.5,
      maxHeight: '120px',
      backgroundColor: COLORS.BG_GRAY,
      color: COLORS.TEXT_MAIN,
    },
    sendBtn: (enabled) => ({
      width: '42px',
      height: '42px',
      borderRadius: '12px',
      border: 'none',
      backgroundColor: enabled ? COLORS.LG_RED : '#E0E0E0',
      color: COLORS.WHITE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: enabled ? 'pointer' : 'not-allowed',
      flexShrink: 0,
      transition: 'background-color 0.2s ease',
    }),
    dragOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      cursor: 'col-resize',
    },
  };

  const canSend = chatInput.trim().length > 0 && !isChatLoading;

  return (
    <div style={styles.editorContainer}>
      <WorkflowStepper currentStep={step} />
      {isDragging && <div style={styles.dragOverlay} />}
      <div style={styles.mainArea} ref={mainAreaRef}>
        {/* Left panel - Brief form / Brief preview / Previous results */}
        <div style={styles.leftPanel}>
          {step >= 3 && submittedBrief ? (
            <div style={{
              width: '100%', height: '100%', backgroundColor: COLORS.BG_GRAY,
              overflowY: 'auto', boxSizing: 'border-box',
            }}>
              {/* Collapsible Brief */}
              <CollapsibleSection
                icon={<FileText size={16} color={COLORS.LG_RED} />}
                title="Campaign Brief"
                badge="Submitted"
                collapsed={isBriefCollapsed}
                onToggle={handleToggleBriefCollapse}
              >
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                  <PreviewBody formData={submittedBrief} />
                </div>
              </CollapsibleSection>

              {/* Market Analyst Report — collapsible at step 4+ */}
              {step >= 4 ? (
                <CollapsibleSection
                  icon={<BarChart2 size={16} color={COLORS.LG_RED} />}
                  title="Market Analyst Report"
                  badge="Approved"
                  collapsed={isReportCollapsed}
                  onToggle={() => setIsReportCollapsed(prev => !prev)}
                >
                  <div style={{ padding: '0 1rem 1rem' }}>
                    <AnalysisReport isApproved={true} analysisResult={analysisResult} />
                  </div>
                </CollapsibleSection>
              ) : (
                <div style={{ padding: '1rem' }}>
                  <AnalysisReport isApproved={true} analysisResult={analysisResult} />
                </div>
              )}

              {/* Strategic Message — shown at step 4+ */}
              {step >= 4 && strategicData && (
                <CollapsibleSection
                  icon={<MessageSquareText size={16} color={COLORS.LG_RED} />}
                  title="Strategic Message"
                  badge="Confirmed"
                  collapsed={isStrategicCollapsed}
                  onToggle={() => setIsStrategicCollapsed(prev => !prev)}
                >
                  <div style={{ padding: '0 1rem 1rem' }}>
                    <StrategicMessage strategicData={strategicData} isApproved={true} readOnly />
                  </div>
                </CollapsibleSection>
              )}

              {/* Generated Copy — shown at step 5 (Review) */}
              {step >= 5 && copyResults && (
                <CollapsibleSection
                  icon={<Globe size={16} color={COLORS.LG_RED} />}
                  title="Generated Copy"
                  badge="Generated"
                  collapsed={isCopyResultsCollapsed}
                  onToggle={() => setIsCopyResultsCollapsed(prev => !prev)}
                >
                  <div style={{ padding: '0 1rem 1rem' }}>
                    <CopyResults results={copyResults} readOnly />
                  </div>
                </CollapsibleSection>
              )}
            </div>
          ) : step > 1 && submittedBrief ? (
            <div style={{
              width: '100%', height: '100%', backgroundColor: COLORS.WHITE,
              overflowY: 'auto', padding: '1.5rem', boxSizing: 'border-box',
            }}>
              <PreviewBody formData={submittedBrief} />
            </div>
          ) : (
            <BriefingForm
              onStartAnalysis={handleStartAnalysis}
              isAnalyzing={isAnalyzing}
              isDisabled={step > 1}
              onGuideSelect={handleGuideSelect}
            />
          )}
        </div>

        {/* Draggable divider */}
        <div
          style={styles.divider}
          onMouseDown={handleMouseDown}
          onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.backgroundColor = COLORS.BORDER; }}
          onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.backgroundColor = 'transparent'; }}
        />

        {/* Right panel - Chat & Results */}
        <div style={styles.rightPanel}>
          <div style={styles.messagesArea}>
            {/* Always show initial greeting */}
            <InitialView />

            {/* Render timeline items chronologically */}
            {timeline.map((item, i) => {
              switch (item.type) {
                case 'chat-user':
                  return (
                    <div key={i} style={styles.userBubble}>
                      <div style={styles.userBubbleContent}>{item.content}</div>
                    </div>
                  );
                case 'chat-assistant':
                  return (
                    <div key={i} style={styles.aiBubbleRow}>
                      <div style={styles.aiAvatar}><Bot size={18} /></div>
                      <div style={styles.aiBubbleContent}>{item.content}</div>
                    </div>
                  );
                case 'analysis-progress':
                  return analysisProgress.length > 0 ? (
                    <div key={i} style={styles.aiBubbleRow}>
                      <div style={styles.aiAvatar}><Bot size={18} /></div>
                      <div style={{
                        ...styles.aiBubbleContent,
                        fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace",
                        fontSize: '0.82rem',
                        lineHeight: 1.8,
                        maxWidth: 'none',
                      }}>
                        {analysisProgress.map((line, j) => (
                          <div key={j} style={{
                            color: line.startsWith('---') ? COLORS.LG_RED
                              : line.startsWith('Error') ? '#DC2626'
                              : line.startsWith('Generated') || line.startsWith('Web search') || line.startsWith('RAG retrieved') ? '#2563EB'
                              : line === 'Invoking synthesizer LLM...' || line === 'Analysis completed successfully.' ? '#059669'
                              : COLORS.TEXT_MAIN,
                            fontWeight: line.startsWith('---') ? 700 : 400,
                          }}>
                            {line}
                          </div>
                        ))}
                        {isAnalyzing && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: COLORS.TEXT_SUB }}>
                            <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            <span style={{ fontSize: '0.78rem' }}>Processing...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                case 'analysis-result':
                  return (
                    <ResultView
                      key={i}
                      onApprove={handleApprove}
                      onModify={handleModify}
                      isApproved={isApproved}
                      analysisResult={analysisResult}
                    />
                  );
                case 'strategic-message':
                  return (
                    <StrategicMessageView
                      key={i}
                      strategicData={strategicData}
                      isStrategicLoading={isStrategicLoading}
                      isStrategicApproved={isStrategicApproved}
                      onModifyStrategic={handleModifyStrategic}
                      onApproveStrategic={handleApproveStrategic}
                      onUpdateStrategic={setStrategicData}
                    />
                  );
                case 'generation-config':
                  return (
                    <GenerationConfigView
                      key={i}
                      onSubmitGeneration={handleSubmitGeneration}
                      copyResults={step < 5 ? copyResults : null}
                      isGenerating={isGenerating}
                      onUpdateCopyResults={setCopyResults}
                      onReview={copyResults && step < 5 ? handleReview : undefined}
                    />
                  );
                case 'review':
                  return (
                    <ReviewView
                      key={i}
                      copyResults={copyResults}
                      selectedCopies={selectedCopies}
                      onToggleCopy={handleToggleCopy}
                      enabledSkills={reviewSkills}
                      onToggleSkill={handleToggleReviewSkill}
                      onSubmitReview={handleSubmitReview}
                      isReviewing={isReviewing}
                      reviewResults={reviewResults}
                      reviewSummary={reviewSummary}
                      availableSkills={availableSkills}
                    />
                  );
                default:
                  return null;
              }
            })}

            {/* Loading indicators */}
            {isChatLoading && (
              <div style={styles.aiBubbleRow}>
                <div style={styles.aiAvatar}><Bot size={18} /></div>
                <div style={{ ...styles.aiBubbleContent, ...styles.loadingDots }}>
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: COLORS.TEXT_SUB }} />
                  <span style={{ color: COLORS.TEXT_SUB, fontSize: '0.85rem' }}>답변 생성 중...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div style={styles.chatInputArea}>
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="브리프 작성에 대해 자유롭게 질문하세요... (Enter로 전송, Shift+Enter 줄바꿈)"
              style={styles.chatInput}
              rows={2}
              disabled={isChatLoading}
            />
            <button
              style={styles.sendBtn(canSend)}
              onClick={handleChatSend}
              disabled={!canSend}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
