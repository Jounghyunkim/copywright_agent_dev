import React from 'react';
import { Check, FileText, Search, MessageSquareText, Zap, CheckCircle, ChevronRight } from 'lucide-react';
import { COLORS } from '../styles/theme';

const WorkflowStepper = ({ currentStep, reviewCompleted = false }) => {
  const steps = [
    { id: 1, label: 'Research', desc: 'Research input', icon: FileText },
    { id: 2, label: 'Analysis', desc: 'Market research', icon: Search },
    { id: 3, label: 'Copywriting Strategy', desc: 'Copy strategy', icon: MessageSquareText },
    { id: 4, label: 'Generation', desc: 'Copy creation', icon: Zap },
    { id: 5, label: 'Review', desc: 'Final approval', icon: CheckCircle },
  ];

  const getStepColor = (isCompleted, isActive) => {
    if (isCompleted) return COLORS.SUCCESS;
    if (isActive) return COLORS.LG_RED;
    return '#D1D5DB';
  };

  const styles = {
    container: {
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.WHITE,
      borderBottom: `1px solid ${COLORS.BORDER}`,
      height: '64px',
      gap: '0',
    },
    step: (isCompleted, isActive) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 16px',
      borderRadius: '12px',
      backgroundColor: isActive ? '#FFF0F3' : isCompleted ? '#F0FFF4' : 'transparent',
      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
    }),
    iconOuter: (isCompleted, isActive) => ({
      width: 32,
      height: 32,
      borderRadius: '10px',
      backgroundColor: isCompleted ? COLORS.SUCCESS : isActive ? COLORS.LG_RED : '#F3F4F6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isCompleted || isActive ? COLORS.WHITE : '#9CA3AF',
      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      flexShrink: 0,
      boxShadow: isActive
        ? '0 4px 12px rgba(165, 0, 52, 0.25)'
        : isCompleted
        ? '0 4px 12px rgba(52, 199, 89, 0.25)'
        : 'none',
    }),
    textGroup: {
      display: 'flex',
      flexDirection: 'column',
    },
    label: (isCompleted, isActive) => ({
      fontSize: '0.82rem',
      fontWeight: isActive ? 700 : 600,
      color: isActive ? COLORS.LG_RED : isCompleted ? COLORS.SUCCESS : COLORS.TEXT_MAIN,
      lineHeight: 1.2,
      transition: 'color 0.3s ease',
    }),
    desc: (isCompleted, isActive) => ({
      fontSize: '0.68rem',
      color: isActive ? 'rgba(165, 0, 52, 0.6)' : isCompleted ? 'rgba(52, 199, 89, 0.7)' : COLORS.TEXT_SUB,
      lineHeight: 1.2,
      marginTop: '1px',
      transition: 'color 0.3s ease',
    }),
    connector: (isCompleted) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      flexShrink: 0,
    }),
    connectorLine: (isCompleted) => ({
      width: '20px',
      height: '2px',
      borderRadius: '1px',
      backgroundColor: isCompleted ? COLORS.SUCCESS : COLORS.BORDER,
      transition: 'background-color 0.35s ease',
    }),
    connectorChevron: (isCompleted) => ({
      color: isCompleted ? COLORS.SUCCESS : '#D1D5DB',
      transition: 'color 0.35s ease',
    }),
    stepNumber: (isCompleted, isActive) => ({
      position: 'absolute',
      top: '-2px',
      right: '-2px',
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      backgroundColor: COLORS.WHITE,
      color: getStepColor(isCompleted, isActive),
      fontSize: '0.55rem',
      fontWeight: 800,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1.5px solid ${getStepColor(isCompleted, isActive)}`,
    }),
  };

  return (
    <nav style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id || (step.id === 5 && reviewCompleted);
        const isActive = currentStep === step.id && !reviewCompleted;
        const isLastStep = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div style={styles.step(isCompleted, isActive)}>
              <div style={{ position: 'relative' }}>
                <div style={styles.iconOuter(isCompleted, isActive)}>
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : <step.icon size={15} />}
                </div>
                <div style={styles.stepNumber(isCompleted, isActive)}>{step.id}</div>
              </div>
              <div style={styles.textGroup}>
                <span style={styles.label(isCompleted, isActive)}>{step.label}</span>
                <span style={styles.desc(isCompleted, isActive)}>{step.desc}</span>
              </div>
            </div>
            {!isLastStep && (
              <div style={styles.connector(isCompleted)}>
                <div style={styles.connectorLine(isCompleted)} />
                <ChevronRight size={14} style={styles.connectorChevron(isCompleted)} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default WorkflowStepper;
