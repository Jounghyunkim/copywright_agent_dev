import React, { useState } from 'react';
import { ArrowRight, Loader } from 'lucide-react';
import { COLORS } from '../styles/theme';

const TONE_OPTIONS = ['Emotional', 'Rational', 'Inspirational', 'Humorous', 'Bold'];

const BriefingForm = ({ onStartAnalysis, isAnalyzing, isDisabled }) => {
  const [formData, setFormData] = useState({
    projectName: "Life's Good Social Campaign",
    campaignPeriod: '2026.03 - 2026.05',
    targetCountry: 'USA',
    targetAudience: 'Millennials aged 25-35',
    toneAndManner: 'Emotional',
    keyBenefits: 'Sustainable design, premium sound quality, seamless connectivity',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToneClick = (tone) => {
    if (!isDisabled) {
      setFormData(prev => ({ ...prev, toneAndManner: tone }));
    }
  };

  const styles = {
    sidebar: {
      width: '360px',
      flexShrink: 0,
      backgroundColor: COLORS.WHITE,
      borderRight: `1px solid ${COLORS.BORDER}`,
      overflowY: 'auto',
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },
    sectionTitle: {
      fontSize: '0.75rem',
      fontWeight: 700,
      color: COLORS.TEXT_SUB,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '8px',
      marginTop: 0,
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      borderRadius: '10px',
      border: `1px solid ${COLORS.BORDER}`,
      fontSize: '0.9rem',
      outline: 'none',
      backgroundColor: isDisabled ? '#F8F9FA' : COLORS.WHITE,
      color: COLORS.TEXT_MAIN,
      boxSizing: 'border-box',
    },
    textarea: {
      width: '100%',
      padding: '10px 14px',
      borderRadius: '10px',
      border: `1px solid ${COLORS.BORDER}`,
      fontSize: '0.9rem',
      outline: 'none',
      backgroundColor: isDisabled ? '#F8F9FA' : COLORS.WHITE,
      color: COLORS.TEXT_MAIN,
      resize: 'vertical',
      minHeight: '90px',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
    },
    toneBtn: (isActive) => ({
      padding: '6px 14px',
      borderRadius: '20px',
      border: `1px solid ${isActive ? COLORS.LG_RED : COLORS.BORDER}`,
      backgroundColor: isActive ? '#FFF0F3' : COLORS.WHITE,
      color: isActive ? COLORS.LG_RED : COLORS.TEXT_SUB,
      fontWeight: isActive ? 700 : 500,
      fontSize: '0.82rem',
      cursor: isDisabled ? 'default' : 'pointer',
    }),
    primaryBtn: {
      width: '100%',
      backgroundColor: isAnalyzing ? COLORS.TEXT_SUB : COLORS.LG_RED,
      color: COLORS.WHITE,
      padding: '14px',
      borderRadius: '12px',
      border: 'none',
      fontWeight: 700,
      fontSize: '1rem',
      cursor: isAnalyzing ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      boxShadow: '0 8px 20px rgba(165, 0, 52, 0.2)',
      marginTop: '0.5rem',
    },
  };

  return (
    <aside style={styles.sidebar}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800 }}>Campaign Brief</h3>
        <p style={{ margin: 0, fontSize: '0.82rem', color: COLORS.TEXT_SUB }}>Fill out the details to start the AI analysis.</p>
      </div>

      <div>
        <p style={styles.sectionTitle}>Project Name</p>
        <input
          name="projectName"
          style={styles.input}
          value={formData.projectName}
          onChange={handleChange}
          disabled={isDisabled}
          placeholder="e.g. LG OLED TV Launch"
        />
      </div>

      <div>
        <p style={styles.sectionTitle}>Campaign Period</p>
        <input
          name="campaignPeriod"
          style={styles.input}
          value={formData.campaignPeriod}
          onChange={handleChange}
          disabled={isDisabled}
          placeholder="e.g. 2026.03 - 2026.05"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <p style={styles.sectionTitle}>Target Country</p>
          <input
            name="targetCountry"
            style={styles.input}
            value={formData.targetCountry}
            onChange={handleChange}
            disabled={isDisabled}
            placeholder="e.g. USA"
          />
        </div>
        <div>
          <p style={styles.sectionTitle}>Target Audience</p>
          <input
            name="targetAudience"
            style={styles.input}
            value={formData.targetAudience}
            onChange={handleChange}
            disabled={isDisabled}
            placeholder="e.g. Millennials"
          />
        </div>
      </div>

      <div>
        <p style={styles.sectionTitle}>Tone &amp; Manner</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {TONE_OPTIONS.map(tone => (
            <button
              key={tone}
              style={styles.toneBtn(formData.toneAndManner === tone)}
              onClick={() => handleToneClick(tone)}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p style={styles.sectionTitle}>Key Benefits / Selling Points</p>
        <textarea
          name="keyBenefits"
          style={styles.textarea}
          value={formData.keyBenefits}
          onChange={handleChange}
          disabled={isDisabled}
          placeholder="Describe the key benefits of the product or service..."
        />
      </div>

      {!isDisabled && (
        <button
          style={styles.primaryBtn}
          onClick={() => onStartAnalysis(formData)}
          disabled={isAnalyzing}
        >
          {isAnalyzing
            ? <>Analyzing...</>
            : <>Start Analysis <ArrowRight size={18} /></>
          }
        </button>
      )}
    </aside>
  );
};

export default BriefingForm;
