import React, { useState } from 'react';
import { 
  MessageSquare, Send, Bot, User, Settings, 
  Globe, Users, Zap, FileText, CheckCircle, Search, HelpCircle, ChevronRight, Info, Plus, BarChart3, Clock, LayoutDashboard
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

// Mock Data for Dashboard
const PAST_PROJECTS = [
  { id: 1, title: 'LG Objet OLED TV Launch', country: 'Germany', date: '2026-03-10', score: 92, status: 'Completed', summary: 'Focused on premium minimalist lifestyle and rational technology benefits.' },
  { id: 2, title: 'InstaView Refrigerator Global', country: 'Global', date: '2026-03-05', score: 88, status: 'In Review', summary: 'Emotional appeal to family health and freshness with multilingual support.' },
  { id: 3, title: 'Gram Pro US Campaign', country: 'USA', date: '2026-02-28', score: 95, status: 'Completed', summary: 'Emphasized extreme portability for Gen Z students and professionals.' },
];

function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'editor'
  const [step, setStep] = useState(1);
  const [activeTone, setActiveTone] = useState('Emotional');

  // Modern Styles (Shared & Unique)
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
      gap: '14px',
      cursor: 'pointer'
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
    // Dashboard Styles
    dashboard: {
      flex: 1,
      overflowY: 'auto',
      padding: '3rem 10%',
      display: 'flex',
      flexDirection: 'column',
      gap: '2.5rem'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1.5rem'
    },
    statCard: {
      backgroundColor: COLORS.WHITE,
      padding: '1.5rem',
      borderRadius: '16px',
      boxShadow: `0 4px 12px ${COLORS.SHADOW}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    projectCard: {
      backgroundColor: COLORS.WHITE,
      padding: '1.5rem',
      borderRadius: '16px',
      boxShadow: `0 2px 8px ${COLORS.SHADOW}`,
      border: `1px solid ${COLORS.BORDER}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer'
    },
    // Editor Styles
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

  const Dashboard = () => (
    <div style={styles.dashboard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Project Dashboard</h2>
          <p style={{ color: COLORS.TEXT_SUB, margin: '5px 0 0 0' }}>Overview of your AI-driven marketing campaigns.</p>
        </div>
        <button 
          onClick={() => setView('editor')}
          style={{ ...styles.primaryBtn, padding: '12px 24px', fontSize: '0.9rem' }}
        >
          <Plus size={18} /> New Campaign
        </button>
      </div>

      {/* Statistics */}
      <div style={styles.statsGrid}>
        {[
          { label: 'Total Projects', value: '12', icon: LayoutDashboard, color: '#007AFF' },
          { label: 'Avg. Brand Score', value: '91.5%', icon: BarChart3, color: COLORS.SUCCESS },
          { label: 'Target Regions', value: '4', icon: Globe, color: '#FF9500' },
          { label: 'Generation Time', value: '2.4s', icon: Clock, color: '#5856D6' }
        ].map((stat, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.TEXT_SUB }}>{stat.label}</span>
              <stat.icon size={18} color={stat.color} />
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Project List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recent Campaigns</h3>
          <div style={{ position: 'relative' }}>
            <input 
              style={{ ...styles.input, padding: '8px 12px 8px 35px', width: '250px', fontSize: '0.85rem' }} 
              placeholder="Search projects..." 
            />
            <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: COLORS.TEXT_SUB }} />
          </div>
        </div>

        {PAST_PROJECTS.map(project => (
          <div key={project.id} style={styles.projectCard} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{project.title}</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#F0F0F0', padding: '2px 8px', borderRadius: '10px', color: COLORS.TEXT_SUB }}>{project.country}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: COLORS.TEXT_SUB, maxWidth: '600px' }}>{project.summary}</p>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: COLORS.TEXT_SUB, marginBottom: '2px' }}>Brand Score</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: COLORS.LG_RED }}>{project.score}</div>
              </div>
              <ChevronRight size={20} color={COLORS.BORDER} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoArea} onClick={() => setView('dashboard')}>
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

      {view === 'dashboard' ? <Dashboard /> : (
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

            <button style={styles.primaryBtn} onClick={() => setStep(2)}>
              Start Analysis <ChevronRight size={18} />
            </button>
          </aside>

          {/* Content Area */}
          <div style={styles.contentArea}>
            {/* Stepper */}
            <nav style={styles.stepper}>
              <div style={styles.step(step === 1, step > 1)}><FileText size={18} /> Briefing</div>
              <ChevronRight size={14} color={COLORS.BORDER} />
              <div style={styles.step(step === 2, step > 2)}><Search size={18} /> Analysis</div>
              <ChevronRight size={14} color={COLORS.BORDER} />
              <div style={styles.step(step === 3, step > 3)}><Zap size={18} /> Generation</div>
              <ChevronRight size={14} color={COLORS.BORDER} />
              <div style={styles.step(step === 4, step > 4)}><CheckCircle size={18} /> Review</div>
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
      )}
    </div>
  );
}

export default App;
