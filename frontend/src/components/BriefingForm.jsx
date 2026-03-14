import React, { useState } from 'react';
import { 
  Globe, Users, Info, ChevronRight, Check, Zap, Hash, BarChartHorizontal, 
  Smile, Award, Target, MessageCircle, AlertTriangle, Star, ShieldCheck, Speaker, ThumbsUp, ArrowRight
} from 'lucide-react';
import { COLORS } from '../styles/theme';

// Accordion-style section component
const BriefSection = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1px solid ${COLORS.BORDER}`, borderRadius: '12px', backgroundColor: isOpen ? COLORS.WHITE : 'transparent' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1rem', 
          border: 'none', 
          background: 'none', 
          cursor: 'pointer',
          fontWeight: 600,
          color: COLORS.TEXT_MAIN
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon}
          <span>{title}</span>
        </div>
        <ChevronRight size={18} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>
      {isOpen && <div style={{ padding: '0 1rem 1rem 1rem', borderTop: `1px solid ${COLORS.BORDER}` }}>{children}</div>}
    </div>
  );
};

const BriefingForm = ({ onStartAnalysis, isAnalyzing, isDisabled }) => {
  const [activeTone, setActiveTone] = useState('Warm');

  const styles = {
    sidebar: {
      width: '420px',
      backgroundColor: COLORS.SIDEBAR_BG,
      borderRight: `1px solid ${COLORS.BORDER}`,
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      overflowY: 'auto',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginTop: '1rem'
    },
    label: {
      fontSize: '0.8rem',
      fontWeight: 600,
      color: COLORS.TEXT_SUB,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    input: {
      padding: '10px 14px',
      borderRadius: '8px',
      border: `1px solid ${COLORS.BORDER}`,
      fontSize: '0.9rem',
      backgroundColor: '#FBFBFD',
    },
    infoBox: {
      backgroundColor: '#F7F7F7',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '0.85rem',
      color: COLORS.TEXT_SUB,
      lineHeight: 1.6,
      border: `1px solid ${COLORS.BORDER}`
    },
    checkboxGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '0.9rem',
      cursor: 'pointer'
    },
    toneGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    },
    toneTag: (active) => ({
      padding: '6px 12px',
      fontSize: '0.8rem',
      borderRadius: '15px',
      border: `1px solid ${active ? COLORS.LG_RED : COLORS.BORDER}`,
      backgroundColor: active ? '#FFF0F3' : COLORS.WHITE,
      color: active ? COLORS.LG_RED : COLORS.TEXT_MAIN,
      fontWeight: 500,
      cursor: 'pointer',
    }),
    primaryBtn: (disabled) => ({
      backgroundColor: disabled ? COLORS.TEXT_SUB : COLORS.LG_RED,
      color: COLORS.WHITE,
      padding: '16px',
      borderRadius: '12px',
      border: 'none',
      fontWeight: 700,
      fontSize: '1rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      marginTop: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      boxShadow: '0 8px 20px rgba(165, 0, 52, 0.15)',
    }),
  };

  return (
    <aside style={styles.sidebar}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: COLORS.TEXT_MAIN, marginBottom: '1.5rem' }}>Life's Good Campaign Brief</h2>

      <BriefSection title="Project Overview" icon={<BarChartHorizontal size={16} />} defaultOpen={true}>
        <div style={{ ...styles.inputGroup, opacity: isDisabled ? 0.7 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
          <label style={styles.label}>Project Name</label>
          <input style={styles.input} defaultValue="Life’s Good Social Campaign" disabled={isDisabled} />
        </div>
        <div style={{ ...styles.inputGroup, opacity: isDisabled ? 0.7 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
          <label style={styles.label}>Campaign Period</label>
          <input style={styles.input} defaultValue="2026.03 – 2026.05" disabled={isDisabled} />
        </div>
      </BriefSection>

      <BriefSection title="Core Context" icon={<Info size={16} />}>
        <div style={styles.infoBox}>
          This campaign focuses on how LG's technology creates small moments of optimism in daily life, under the theme of **"Brave Optimism"**. The goal is to reinforce the "Life's Good" philosophy emotionally.
        </div>
      </BriefSection>

      <BriefSection title="Campaign Objective" icon={<Target size={16} />}>
        <div style={{ ...styles.checkboxGroup, marginTop: '1rem', opacity: isDisabled ? 0.7 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
          <label style={styles.checkboxLabel}><input type="checkbox" defaultChecked disabled={isDisabled}/> Strengthen brand's emotional story</label>
          <label style={styles.checkboxLabel}><input type="checkbox" defaultChecked disabled={isDisabled}/> Encourage organic social sharing</label>
          <label style={styles.checkboxLabel}><input type="checkbox" disabled={isDisabled} /> Drive product feature awareness</label>
        </div>
      </BriefSection>
      
      <BriefSection title="Target Audience" icon={<Users size={16} />}>
        <div style={styles.infoBox}>
          **Primary:** Global 20-30s who value brand philosophy.<br/>
          **Mindset:** They prefer meaningful daily experiences over a perfect life.
        </div>
      </BriefSection>

      <BriefSection title="Key Message & Tone" icon={<MessageCircle size={16} />}>
         <div style={styles.inputGroup}>
            <label style={styles.label}>Core Message (Focal Point)</label>
            <div style={styles.infoBox}>
              LG enables a better life by practicing optimism. Our technology makes everyday moments more meaningful.
            </div>
          </div>
          <div style={{ ...styles.inputGroup, opacity: isDisabled ? 0.7 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
            <label style={styles.label}>Tone & Voice</label>
            <div style={styles.toneGrid}>
              {['Warm', 'Human', 'Optimistic', 'Meaningful', 'Confident'].map(t => (
                <button key={t} disabled={isDisabled} onClick={() => setActiveTone(t)} style={styles.toneTag(activeTone === t)}>{t}</button>
              ))}
            </div>
          </div>
      </BriefSection>

      <BriefSection title="Mandatory Rules" icon={<ShieldCheck size={16} />}>
         <div style={{ ...styles.checkboxGroup, marginTop: '1rem', opacity: isDisabled ? 0.7 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
          <label style={styles.checkboxLabel}><input type="checkbox" defaultChecked disabled={isDisabled}/> Include "Life's Good" brand line</label>
          <label style={styles.checkboxLabel}><input type="checkbox" defaultChecked disabled={isDisabled}/> Optimize for Social Media (Insta, TikTok)</label>
          <label style={styles.checkboxLabel}><input type="checkbox" defaultChecked disabled={isDisabled}/> Ensure global cultural neutrality</label>
        </div>
      </BriefSection>

      <button style={{...styles.primaryBtn(isDisabled), opacity: isDisabled ? 0.7 : 1}} onClick={onStartAnalysis} disabled={isDisabled}>
        {isAnalyzing ? 'Analyzing...' : 'Start Analysis'} <ArrowRight size={18} />
      </button>
    </aside>
  );
};

export default BriefingForm;
