import React from 'react';
import { ChevronRight, FileText, Search, Zap, CheckCircle } from 'lucide-react';
import { COLORS } from '../styles/theme';

const WorkflowStepper = ({ currentStep }) => {
  const styles = {
    stepper: {
      padding: '1.5rem 3rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
      backgroundColor: COLORS.WHITE,
      borderBottom: `1px solid ${COLORS.BORDER}`,
    },
    step: (active, completed) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: active ? COLORS.LG_RED : completed ? COLORS.SUCCESS : COLORS.TEXT_SUB,
      opacity: active || completed ? 1 : 0.5,
      fontWeight: active ? 700 : 500,
    }),
  };

  return (
    <nav style={styles.stepper}>
      <div style={styles.step(currentStep === 1, currentStep > 1)}>
        <FileText size={18} /> Briefing
      </div>
      <ChevronRight size={14} color={COLORS.BORDER} />
      <div style={styles.step(currentStep === 2, currentStep > 2)}>
        <Search size={18} /> Analysis
      </div>
      <ChevronRight size={14} color={COLORS.BORDER} />
      <div style={styles.step(currentStep === 3, currentStep > 3)}>
        <Zap size={18} /> Generation
      </div>
      <ChevronRight size={14} color={COLORS.BORDER} />
      <div style={styles.step(currentStep === 4, currentStep > 4)}>
        <CheckCircle size={18} /> Review
      </div>
    </nav>
  );
};

export default WorkflowStepper;
