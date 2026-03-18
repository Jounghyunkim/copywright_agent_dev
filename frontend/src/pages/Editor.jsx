import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Loader } from 'lucide-react';
import { COLORS } from '../styles/theme';
import WorkflowStepper from '../components/WorkflowStepper';
import BriefingForm, { PreviewBody } from '../components/BriefingForm';
import { InitialView, ResultView } from '../components/EditorViews';

const MIN_PANEL_WIDTH = 320;

const Editor = () => {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [leftRatio, setLeftRatio] = useState(0.4);
  const [isDragging, setIsDragging] = useState(false);
  const [submittedBrief, setSubmittedBrief] = useState(null);
  const messagesEndRef = useRef(null);
  const mainAreaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, analysisResult, isAnalyzing]);

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
    setSubmittedBrief(null);
    setStep(1);
  };

  const handleGuideSelect = (guideInfo) => {
    const guideMessage = `[${guideInfo.title}] 작성 가이드\n\n${guideInfo.guide}`;
    setChatMessages(prev => [...prev, { role: 'assistant', content: guideMessage }]);
  };

  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || isChatLoading) return;

    const newMessages = [...chatMessages, { role: 'user', content: text }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/v1/campaigns/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.reply }]);
    } catch (error) {
      console.error('Chat API call failed:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: '죄송합니다. 응답 중 오류가 발생했습니다. 다시 시도해 주세요.' }]);
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
    chatDivider: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      margin: '0.5rem 0',
    },
    chatDividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: COLORS.BORDER,
    },
    chatDividerLabel: {
      fontSize: '0.75rem',
      color: COLORS.TEXT_SUB,
      fontWeight: 600,
      whiteSpace: 'nowrap',
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
        {/* Left panel - Brief form or Brief preview */}
        <div style={styles.leftPanel}>
          {step > 1 && submittedBrief ? (
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

            {chatMessages.length > 0 && (
              <div style={styles.chatDivider}>
                <div style={styles.chatDividerLine} />
                <span style={styles.chatDividerLabel}>브리프 작성 Q&amp;A</span>
                <div style={styles.chatDividerLine} />
              </div>
            )}

            {chatMessages.map((msg, i) =>
              msg.role === 'user' ? (
                <div key={i} style={styles.userBubble}>
                  <div style={styles.userBubbleContent}>{msg.content}</div>
                </div>
              ) : (
                <div key={i} style={styles.aiBubbleRow}>
                  <div style={styles.aiAvatar}><Bot size={18} /></div>
                  <div style={styles.aiBubbleContent}>{msg.content}</div>
                </div>
              )
            )}

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
