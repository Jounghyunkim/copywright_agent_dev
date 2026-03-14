import React, { useState } from 'react';
import { Globe, Users, Info, ChevronRight } from 'lucide-react';
import { COLORS } from '../styles/theme';

const BriefingForm = ({ onStartAnalysis }) => {
  const [activeTone, setActiveTone] = useState('Emotional');

  const styles = {
    sidebar: {
      width: '380px',
      backgroundColor: COLORS.SIDEBAR_BG,
      borderRight: `1px solid ${COLORS.BORDER}`,
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      overflowY: 'auto',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '0.8rem',
      fontWeight: 600,
      color: COLORS.TEXT_SUB,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    input: {
      padding: '12px 16px',
      borderRadius: '10px',
      border: `1px solid ${COLORS.BORDER}`,
      fontSize: '0.95rem',
      transition: 'all 0.2s ease',
      outline: 'none',
      backgroundColor: '#FBFBFD',
    },
    select: {
      appearance: 'none',
      padding: '12px 16px',
      borderRadius: '10px',
      border: `1px solid ${COLORS.BORDER}`,
      fontSize: '0.95rem',
      backgroundColor: '#FBFBFD',
      cursor: 'pointer',
    },
    toneGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
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
      transition: 'all 0.2s ease',
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
      transition: 'transform 0.2s ease',
    },
  };

  return (
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
          <label style={styles.label}>
            <Globe size={13} /> Country
          </label>
          <select style={styles.select}>
            <option>Global (All)</option>
            <option>USA</option>
            <option>Germany</option>
            <option>India</option>
            <option>South Korea</option>
          </select>
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            <Users size={13} /> Target
          </label>
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
          {['Emotional', 'Rational', 'Technical', 'All Styles'].map((t) => (
            <button key={t} onClick={() => setActiveTone(t)} style={styles.toneBtn(activeTone === t)}>
              {t}
            </button>
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

      <button style={styles.primaryBtn} onClick={onStartAnalysis}>
        Start Analysis <ChevronRight size={18} />
      </button>
    </aside>
  );
};

export default BriefingForm;
