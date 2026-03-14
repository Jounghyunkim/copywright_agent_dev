import React, { useState } from 'react';
import { 
  MessageSquare, Send, Bot, User, Settings, 
  Globe, Users, Zap, FileText, CheckCircle, Search, HelpCircle, ChevronRight, Info
} from 'lucide-react';

// Premium Color Palette
const COLORS = {
  LG_RED: '#A50034',
  LG_RED_LIGHT: '#C21E4A',
  BG_GRAY: '#F8F9FA',
  SIDEBAR_BG: '#FFFFFF',
  TEXT_MAIN: '#2D2D2D',
  TEXT_SUB: '#6E6E73',
  BORDER: '#E5E5E7',
  WHITE: '#FFFFFF',
  SUCCESS: '#34C759',
  SHADOW: 'rgba(0, 0, 0, 0.08)'
};

function App() {
  const [step, setStep] = useState(1);
  const [activeTone, setActiveTone] = useState('Emotional');

  // Modern Styles
  const styles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: COLORS.BG_GRAY,
      color: COLORS.TEXT_MAIN
    },
    header: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      color: COLORS.TEXT_MAIN,
      padding: '0 2rem',
      height: '70px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `1px solid ${COLORS.BORDER}`,
      zIndex: 100,
      position: 'sticky',
      top: 0
    },
    logoArea: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px'
    },
    logoIcon: {
      backgroundColor: COLORS.LG_RED,
      color: COLORS.WHITE,
      padding: '8px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(165, 0, 52, 0.2)'
    },
    main: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden'
    },
    sidebar: {
      width: '380px',
      backgroundColor: COLORS.SIDEBAR_BG,
      borderRight: `1px solid ${COLORS.BORDER}`,
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      overflowY: 'auto'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '0.8rem',
      fontWeight: 600,
      color: COLORS.TEXT_SUB,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    input: {
      padding: '12px 16px',
      borderRadius: '10px',
      border: `1px solid ${COLORS.BORDER}`,
      fontSize: '0.95rem',
      transition: 'all 0.2s ease',
      outline: 'none',
      backgroundColor: '#FBFBFD'
    },
    select: {
      appearance: 'none',
      padding: '12px 16px',
      borderRadius: '10px',
      border: `1px solid ${COLORS.BORDER}`,
      fontSize: '0.95rem',
      backgroundColor: '#FBFBFD',
      cursor: 'pointer'
    },
    toneGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px'
    },
    toneBtn: (active) => ({
      padding: '10px',
      fontSize: '0.8rem',
      borderRadius: '8px',
      border: active ? `2px solid ${COLORS.LG_RED}` : `1px solid ${COLORS.BORDER}`,
      backgroundColor: active ? '#FFF0F3' : COLORS.WHITE,
      color: active ? COLORS.LG_RED : COLORS.TEXT_MAIN,
      fontWeight: active ? 700 : 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }),
    primaryBtn: {
      backgroundColor: COLORS.LG_RED,
      color: COLORS.WHITE,
      padding: '16px',
      borderRadius: '12px',
      border: 'none',
      fontWeight: 700,
      fontSize: '1rem',
      cursor: 'pointer',
      marginTop: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      boxShadow: '0 8px 20px rgba(165, 0, 52, 0.15)',
      transition: 'transform 0.2s ease'
    },
    contentArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    },
    stepper: {
      padding: '1.5rem 3rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
      backgroundColor: COLORS.WHITE,
      borderBottom: `1px solid ${COLORS.BORDER}`
    },
    step: (active, completed) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: active ? COLORS.LG_RED : completed ? COLORS.SUCCESS : COLORS.TEXT_SUB,
      opacity: active || completed ? 1 : 0.5,
      fontWeight: active ? 700 : 500
    }),
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
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}><Bot size={24} /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Copywrite Agent</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              <span style={{ fontSize: '0.7rem', color: COLORS.TEXT_SUB }}>V 2.0 PREMIUM ENGINE</span>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: COLORS.SUCCESS }}></div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.TEXT_SUB, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} /> Knowledge Base Ready
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: COLORS.BORDER }}></div>
          <Settings style={{ cursor: 'pointer', color: COLORS.TEXT_SUB }} size={20} />
        </div>
      </header>

      <div style={styles.main}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: COLORS.TEXT_MAIN }}>Campaign Info</h2>
            <Info size={16} color={COLORS.TEXT_SUB} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Product Name</label>
            <input style={styles.input} placeholder="e.g. LG Objet Collection" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={styles.inputGroup}>
              <label style={styles.label}><Globe size={13} /> Country</label>
              <select style={styles.select}>
                <option>Global (All)</option>
                <option>USA</option>
                <option>Germany</option>
                <option>India</option>
                <option>South Korea</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}><Users size={13} /> Target</label>
              <select style={styles.select}>
                <option>All Ages</option>
                <option>Millennials</option>
                <option>Gen Z</option>
                <option>Gen X</option>
              </select>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Tone & Manner</label>
            <div style={styles.toneGrid}>
              {['Emotional', 'Rational', 'Technical', 'All Styles'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setActiveTone(t)}
                  style={styles.toneBtn(activeTone === t)}
                >{t}</button>
              ))}
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Key Benefits</label>
            <textarea 
              style={{ ...styles.input, height: '120px', resize: 'none' }} 
              placeholder="What makes this product special for the local market?"
            />
          </div>

          <button style={styles.primaryBtn}>
            Start Analysis <ChevronRight size={18} />
          </button>
        </aside>

        {/* Content Area */}
        <div style={styles.contentArea}>
          {/* Stepper */}
          <nav style={styles.stepper}>
            <div style={styles.step(true, false)}><FileText size={18} /> Briefing</div>
            <ChevronRight size={14} color={COLORS.BORDER} />
            <div style={styles.step(false, false)}><Search size={18} /> Analysis</div>
            <ChevronRight size={14} color={COLORS.BORDER} />
            <div style={styles.step(false, false)}><Zap size={18} /> Generation</div>
            <ChevronRight size={14} color={COLORS.BORDER} />
            <div style={styles.step(false, false)}><CheckCircle size={18} /> Review</div>
          </nav>

          {/* Chat Workspace */}
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

            {/* Empty Interaction Guide */}
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
    </div>
  );
}

export default App;
