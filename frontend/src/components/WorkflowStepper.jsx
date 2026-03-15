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
      padding: '1.5rem 3rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.WHITE,
      borderBottom: `1px solid ${COLORS.BORDER}`,
    },
    stepWrapper: {
      display: 'flex',
      alignItems: 'center',
    },
    stepIcon: (isCompleted, isActive) => ({
      width: 36,
      height: 36,
      borderRadius: '50%',
      backgroundColor: isCompleted ? COLORS.SUCCESS : isActive ? COLORS.LG_RED : COLORS.BORDER,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: COLORS.WHITE,
      transition: 'all 0.3s ease',
    }),
    stepLabel: (isCompleted, isActive) => ({
      marginLeft: '12px',
      fontSize: '1rem',
      fontWeight: isActive ? 700 : 500,
      color: isCompleted ? COLORS.SUCCESS : isActive ? COLORS.LG_RED : COLORS.TEXT_SUB,
      transition: 'all 0.3s ease',
    }),
    connector: (isCompleted) => ({
      flex: 1,
      height: '2px',
      minWidth: '80px',
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
            <div style={styles.stepWrapper}>
              <div style={styles.stepIcon(isCompleted, isActive)}>
                {isCompleted ? <Check size={20} /> : <step.icon size={18} />}
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
