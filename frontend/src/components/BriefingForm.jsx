// src/components/BriefingForm.jsx
import React, { useState } from 'react';
// ... other imports

const BriefingForm = ({ onStartAnalysis, isAnalyzing, isDisabled, isCollapsed }) => {
  const [formData, setFormData] = useState({
    projectName: 'Life’s Good Social Campaign',
    campaignPeriod: '2026.03 – 2026.05',
    targetCountry: 'USA',
    targetAudience: 'Millennials',
    toneAndManner: 'Emotional',
    keyBenefits: '',
  });
  const [activeTone, setActiveTone] = useState('Emotional');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToneClick = (tone) => {
      setActiveTone(tone);
      setFormData(prev => ({ ...prev, toneAndManner: tone }));
  }

  // ... styles object

  return (
    <aside style={/* sidebar style */}>
      <div style={/* inner container style */}>
        {/* ... form content ... */}
        {/* Example of a modified input */}
        <input 
            name="projectName"
            style={styles.input} 
            value={formData.projectName}
            onChange={handleChange}
            disabled={isDisabled} 
        />
        {/* ... all other inputs need to be updated similarly ... */}

        {!isDisabled && (
            <button style={styles.primaryBtn(isAnalyzing)} onClick={() => onStartAnalysis(formData)} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : <>Start Analysis <ArrowRight size={18} /></>}
            </button>
        )}
      </div>
    </aside>
  );
};

export default BriefingForm;
