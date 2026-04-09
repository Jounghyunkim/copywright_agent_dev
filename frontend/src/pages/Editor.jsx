import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Loader, ChevronDown, ChevronRight, FileText, BarChart2, MessageSquareText, Globe, Sparkles, CheckCircle, XCircle, Search, Zap, ClipboardCheck } from 'lucide-react';
import { COLORS } from '../styles/theme';
import { Markdown } from '@/shared/ui/markdown';
import WorkflowStepper from '../components/WorkflowStepper';
import BriefingForm, { PreviewBody } from '../components/BriefingForm';
import { InitialView, ResultView, StrategicMessageView, GenerationConfigView, CopyResultsView, ReviewView, ReviewResultsView } from '../components/EditorViews';
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

const ACTION_CONFIG = {
  'brief-auto-generate': { icon: Sparkles, label: 'AI 리서치 자동생성', color: '#7C3AED' },
  'submit-brief': { icon: FileText, label: '리서치 제출 및 분석 시작', color: COLORS.LG_RED },
  'approve-analysis': { icon: CheckCircle, label: '분석 결과 승인', color: '#059669' },
  'strategic-message-extract': { icon: MessageSquareText, label: 'Strategic Message 추출', color: '#2563EB' },
  'approve-strategic': { icon: CheckCircle, label: 'Strategic Message 승인', color: '#059669' },
  'generate-copy': { icon: Zap, label: '카피 생성', color: '#D97706' },
  'start-review': { icon: ClipboardCheck, label: 'Review 시작', color: '#7C3AED' },
  'submit-review': { icon: ClipboardCheck, label: 'Skillset Review 실행', color: COLORS.LG_RED },
  'save-campaign': { icon: CheckCircle, label: '캠페인 저장', color: '#059669' },
  'modify-brief': { icon: FileText, label: '리서치 수정 요청', color: '#DC2626' },
};

const STATUS_STYLE = {
  started: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', statusLabel: '진행 중...' },
  completed: { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A', statusLabel: '완료' },
  failed: { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', statusLabel: '실패' },
};

const ActionStatusBubble = ({ item }) => {
  const config = ACTION_CONFIG[item.action] || { icon: Zap, label: item.action, color: COLORS.TEXT_SUB };
  const status = STATUS_STYLE[item.status] || STATUS_STYLE.started;
  const IconComp = config.icon;
  const isLoading = item.status === 'started';
  return (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', maxWidth: '85%' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '12px',
        backgroundColor: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: COLORS.WHITE, flexShrink: 0, boxShadow: `0 4px 10px ${config.color}33`,
      }}>
        <IconComp size={18} />
      </div>
      <div style={{
        backgroundColor: COLORS.WHITE, padding: '10px 16px',
        borderRadius: '18px', borderTopLeftRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        fontSize: '0.88rem', lineHeight: 1.6, color: COLORS.TEXT_MAIN,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: item.detail ? '4px' : 0 }}>
          {isLoading
            ? <Loader size={13} color={status.text} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            : item.status === 'completed'
              ? <CheckCircle size={13} color={status.text} style={{ flexShrink: 0 }} />
              : <XCircle size={13} color={status.text} style={{ flexShrink: 0 }} />
          }
          <span style={{ fontWeight: 700 }}>{config.label}</span>
          <span style={{
            fontSize: '0.68rem', fontWeight: 600, padding: '1px 6px', borderRadius: '4px',
            backgroundColor: status.bg, color: status.text, border: `1px solid ${status.border}`,
          }}>{status.statusLabel}</span>
        </div>
        {item.detail && (
          <div style={{ fontSize: '0.82rem', color: COLORS.TEXT_SUB }}>{item.detail}</div>
        )}
      </div>
    </div>
  );
};

const Editor = ({ setView, campaignId }) => {
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
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef(null);
  const mainAreaRef = useRef(null);

  const addToTimeline = useCallback((item) => {
    setTimeline(prev => [...prev, item]);
  }, []);

  // 액션 상태를 타임라인에 추가 (started → completed/failed로 업데이트)
  const addAction = useCallback((action, status, detail) => {
    setTimeline(prev => {
      // started일 때는 새 항목 추가
      if (status === 'started') {
        return [...prev, { type: 'action-status', action, status, detail, _actionId: `${action}-${Date.now()}` }];
      }
      // completed/failed일 때는 마지막 같은 action의 started를 업데이트
      const idx = [...prev].reverse().findIndex(
        it => it.type === 'action-status' && it.action === action && it.status === 'started'
      );
      if (idx >= 0) {
        const realIdx = prev.length - 1 - idx;
        const updated = [...prev];
        updated[realIdx] = { ...updated[realIdx], status, detail };
        return updated;
      }
      return [...prev, { type: 'action-status', action, status, detail }];
    });
  }, []);

  // BriefingForm에서 올라오는 액션 알림 핸들러
  const handleActionNotify = useCallback(({ action, status, detail }) => {
    addAction(action, status, detail);
  }, [addAction]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline, isAnalyzing, isStrategicLoading, isChatLoading, isGenerating, isReviewing]);

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
    addAction('submit-brief', 'started', `프로젝트: ${formData.projectName}`);

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
              // 진행 로그는 action-status 버블로 대체
            } else if (event.type === 'result') {
              setAnalysisResult(event.data);
              setAnalysisProgress(prev => [...prev, 'Analysis completed successfully.']);
              addAction('submit-brief', 'completed', 'Market Analyst Report 생성 완료');
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
      addAction('submit-brief', 'failed', error.message);
      alert('Analysis failed. Please check the console for details and ensure the backend server is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    setIsApproved(true);
    setStep(3);
    setIsBriefCollapsed(true);
    addAction('approve-analysis', 'completed', 'Market Analyst Report 승인');
    addAction('strategic-message-extract', 'started', 'Strategic Message 추출 중...');
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
      addAction('strategic-message-extract', 'completed', 'Core Message + Message Pillars 도출 완료');
    } catch (error) {
      console.error('Strategic message extraction failed:', error);
      addAction('strategic-message-extract', 'failed', error.message);
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
    addAction('approve-strategic', 'completed', 'Strategic Message 승인 → 카피 생성 설정 단계 진입');
    addToTimeline({ type: 'generation-config' });
    setStep(4);
  };

  const handleSubmitGeneration = async (config) => {
    setIsGenerating(true);
    setCopyResults(null);
    addAction('generate-copy', 'started', `${config.countries.length}개 국가 × ${config.copyCount}개 변형`);

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
      const totalCopies = (result.data || []).reduce((s, r) => s + (r.copies?.length || 1), 0);
      addAction('generate-copy', 'completed', `${totalCopies}개 카피 생성 완료`);
      addToTimeline({ type: 'copy-results' });
    } catch (error) {
      console.error('Copy generation failed:', error);
      addAction('generate-copy', 'failed', error.message);
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
    addAction('start-review', 'completed', `${allKeys.size}개 카피 선택됨 → Review 설정 단계`);
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

  // --- 기존 캠페인 로딩 (Dashboard에서 클릭 시) ---
  useEffect(() => {
    if (!campaignId) return;
    const loadCampaign = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${apiBase}/api/v1/campaigns/${campaignId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // 상태 복원
        setSubmittedBrief(data.brief);
        setAnalysisResult(data.analysisReport);
        setStrategicData(data.strategicMessage);
        setCopyResults(data.copyResults);
        setIsApproved(true);
        setIsStrategicApproved(true);
        setIsBriefCollapsed(true);
        setIsReportCollapsed(true);
        setIsStrategicCollapsed(true);
        setIsCopyResultsCollapsed(false);

        // Review 결과 복원
        if (data.reviewResults && data.reviewResults.length > 0) {
          setReviewResults(data.reviewResults);
        }
        if (data.reviewSummary) {
          setReviewSummary(data.reviewSummary);
        }

        // 선택된 카피 전체 선택
        const allKeys = new Set();
        (data.copyResults || []).forEach(r => {
          const copies = r.copies || [r];
          copies.forEach((_, idx) => allKeys.add(`${r.countryCode}-${idx}`));
        });
        setSelectedCopies(allKeys);

        // 타임라인 구성 — Review 완료 상태로
        setTimeline([
          { type: 'analysis-result' },
          { type: 'strategic-message' },
          { type: 'generation-config' },
          { type: 'copy-results' },
          { type: 'action-status', action: 'save-campaign', status: 'completed', detail: `캠페인 "${data.projectName}" 로드 완료` },
          { type: 'review' },
          ...(data.reviewResults?.length > 0 ? [{ type: 'review-results' }] : []),
        ]);

        setStep(5);
      } catch (error) {
        console.error('Campaign load failed:', error);
        alert('캠페인 로딩에 실패했습니다.');
      }
    };
    loadCampaign();
  }, [campaignId]);

  const handleSubmitReview = async () => {
    if (!copyResults || selectedCopies.size === 0 || reviewSkills.length === 0) return;
    setIsReviewing(true);
    setReviewResults([]);
    setReviewSummary(null);

    // 기존 review 관련 타임라인 항목 제거 (이전 결과 + 이전 액션)
    setTimeline(prev => prev.filter(
      item => item.type !== 'review-results' && !(item.type === 'action-status' && item.action === 'submit-review')
    ));

    addAction('submit-review', 'started', `${selectedCopies.size}개 카피 × ${reviewSkills.length}개 스킬`);
    addToTimeline({ type: 'review-results' });

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
              addAction('submit-review', 'completed', `Avg Score: ${event.summary?.avgScore} (${event.summary?.passed}/${event.summary?.total} Pass)`);
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
      addAction('submit-review', 'failed', error.message);
      alert('리뷰 실행에 실패했습니다. 백엔드 서버를 확인해주세요.');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleSaveExit = async () => {
    setIsSaving(true);
    const isUpdate = !!campaignId;
    addAction('save-campaign', 'started', isUpdate ? '캠페인 업데이트 중...' : '캠페인 산출물 저장 중...');
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const url = isUpdate
        ? `${apiBase}/api/v1/campaigns/${campaignId}`
        : `${apiBase}/api/v1/campaigns/save`;
      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: submittedBrief,
          analysisReport: analysisResult,
          strategicMessage: strategicData,
          copyResults: copyResults,
          reviewSummary: reviewSummary,
          reviewResults: reviewResults,
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      const verb = isUpdate ? '업데이트' : '저장';
      addAction('save-campaign', 'completed', `캠페인 "${result.projectName}" ${verb} 완료`);
      setTimeout(() => setView('dashboard'), 500);
    } catch (error) {
      console.error('Campaign save failed:', error);
      addAction('save-campaign', 'failed', error.message);
      alert('캠페인 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExitWithoutSave = () => {
    setView('dashboard');
  };

  const handleModify = () => {
    addAction('modify-brief', 'completed', '리서치 수정을 위해 Step 1으로 이동');
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

  // Step-aware chat placeholder & context
  const chatPlaceholders = {
    1: '브리프 작성에 대해 질문하세요. 타겟 오디언스, 키 메시지, 톤앤매너 등을 도와드립니다... (Enter로 전송)',
    2: '분석 결과에 대해 질문하세요. 페르소나, 브랜드 적합도, 경쟁 키워드 등을 설명해 드립니다... (Enter로 전송)',
    3: 'Strategic Message에 대해 질문하세요. Core Message, Message Pillars 방향성을 함께 논의합니다... (Enter로 전송)',
    4: '생성된 카피에 대해 질문하세요. 헤드라인, CTA 효과, 시장별 적합성 등을 검토합니다... (Enter로 전송)',
    5: '리뷰 결과에 대해 질문하세요. 검증 결과 해석, 수정 방향을 함께 논의합니다... (Enter로 전송)',
  };

  const buildChatContext = () => {
    const ctx = {};
    if (submittedBrief) ctx.brief = submittedBrief;
    if (analysisResult) ctx.analysisReport = analysisResult;
    if (strategicData) ctx.strategicMessage = strategicData;
    if (copyResults) ctx.copyResults = copyResults;
    if (reviewResults) ctx.reviewResults = reviewResults;
    return Object.keys(ctx).length > 0 ? ctx : null;
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
        body: JSON.stringify({ messages: chatHistory, currentStep: step, context: buildChatContext() }),
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
      <WorkflowStepper currentStep={step} reviewCompleted={!!reviewSummary} />
      {isDragging && <div style={styles.dragOverlay} />}
      <div style={styles.mainArea} ref={mainAreaRef}>
        {/* Left panel - Brief form / Brief preview / Previous results */}
        <div style={styles.leftPanel}>
          {step > 1 && submittedBrief ? (
            <div style={{
              width: '100%', height: '100%', backgroundColor: COLORS.BG_GRAY,
              overflowY: 'auto', boxSizing: 'border-box',
            }}>
              {/* Research Summary */}
              <CollapsibleSection
                icon={<FileText size={16} color={COLORS.LG_RED} />}
                title="Research Summary"
                badge="Submitted"
                collapsed={isBriefCollapsed}
                onToggle={handleToggleBriefCollapse}
              >
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                  <PreviewBody formData={submittedBrief} />
                </div>
              </CollapsibleSection>

              {/* Market Analyst Report */}
              {analysisResult && (
                <CollapsibleSection
                  icon={<BarChart2 size={16} color={COLORS.LG_RED} />}
                  title="Market Analyst Report"
                  badge={isApproved ? 'Approved' : 'Generated'}
                  collapsed={isReportCollapsed}
                  onToggle={() => setIsReportCollapsed(prev => !prev)}
                >
                  <div style={{ padding: '0 1rem 1rem' }}>
                    <AnalysisReport isApproved={true} analysisResult={analysisResult} />
                  </div>
                </CollapsibleSection>
              )}

              {/* Strategic Message */}
              {strategicData && (
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

              {/* Generated Copy */}
              {copyResults && (
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
          ) : (
            <BriefingForm
              onStartAnalysis={handleStartAnalysis}
              isAnalyzing={isAnalyzing}
              isDisabled={step > 1}
              onGuideSelect={handleGuideSelect}
              onActionNotify={handleActionNotify}
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
                      <div style={styles.aiBubbleContent}><Markdown>{item.content || ''}</Markdown></div>
                    </div>
                  );
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
                      isGenerating={isGenerating}
                    />
                  );
                case 'copy-results':
                  return (
                    <CopyResultsView
                      key={i}
                      copyResults={copyResults}
                      isGenerating={isGenerating}
                      onUpdateCopyResults={setCopyResults}
                      onReview={copyResults && step < 5 ? handleReview : undefined}
                    />
                  );
                case 'action-status':
                  return <ActionStatusBubble key={i} item={item} />;
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
                      availableSkills={availableSkills}
                    />
                  );
                case 'review-results':
                  return (
                    <ReviewResultsView
                      key={i}
                      reviewResults={reviewResults}
                      reviewSummary={reviewSummary}
                      copyResults={copyResults}
                      isReviewing={isReviewing}
                      onSaveExit={handleSaveExit}
                      onExitWithoutSave={handleExitWithoutSave}
                      isSaving={isSaving}
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
              placeholder={chatPlaceholders[step] || chatPlaceholders[1]}
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
