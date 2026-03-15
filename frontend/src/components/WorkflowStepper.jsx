import React from 'react';
import { Check, FileText, Search, Zap, CheckCircle } from 'lucide-react';
import { COLORS } from '../styles/theme';

const WorkflowStepper = ({ currentStep }) => {
  const steps = [
    { id: 1, label: 'Briefing', icon: FileText },
    { id: 2, label: 'Analysis', icon: Search },
    { id: 3, label: 'Generation', icon: Zap },
    { id: 4, label: 'Review', icon: CheckCircle },
  ];

  const styles = {
    stepperContainer: {
      padding: '0 3rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.WHITE,
      borderBottom: `1px solid ${COLORS.BORDER}`,
      height: '80px',
    },
    stepWrapper: (isActive) => ({
      display: 'flex',
      alignItems: 'center',
      padding: '0 1rem',
      height: '100%',
      borderBottom: isActive ? `3px solid ${COLORS.LG_RED}` : '3px solid transparent',
      transition: 'all 0.3s ease',
    }),
    stepIcon: (isCompleted, isActive) => ({
      width: 40,
      height: 40,
      borderRadius: '50%',
      backgroundColor: isCompleted ? COLORS.SUCCESS : isActive ? COLORS.LG_RED : '#F0F0F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isCompleted || isActive ? COLORS.WHITE : COLORS.TEXT_SUB,
      transition: 'all 0.3s ease',
      flexShrink: 0,
    }),
    stepLabel: (isCompleted, isActive) => ({
      marginLeft: '1rem',
      fontSize: '1.1rem',
      fontWeight: isActive ? 700 : 500,
      color: isActive ? COLORS.LG_RED : isCompleted ? COLORS.SUCCESS : COLORS.TEXT_SUB,
    }),
    connector: (isCompleted) => ({
      flex: 1,
      height: '2px',
      minWidth: '60px',
      backgroundColor: isCompleted ? COLORS.SUCCESS : COLORS.BORDER,
      margin: '0 1rem',
      transition: 'background-color 0.3s ease',
    }),
  };

  return (
    <nav style={styles.stepperContainer}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        const isLastStep = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div style={styles.stepWrapper(isActive)}>
              <div style={styles.stepIcon(isCompleted, isActive)}>
                {isCompleted ? <Check size={22} /> : <step.icon size={20} />}
              </div>
              <span style={styles.stepLabel(isCompleted, isActive)}>{step.label}</span>
            </div>
            {!isLastStep && <div style={styles.connector(isCompleted)}></div>}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default WorkflowStepper;
