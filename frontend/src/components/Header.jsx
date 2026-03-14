import React from 'react';
import { Bot, Search, Settings } from 'lucide-react';
import { COLORS } from '../styles/theme';

const Header = ({ setView }) => {
  const styles = {
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
      top: 0,
    },
    logoArea: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      cursor: 'pointer',
    },
    logoIcon: {
      backgroundColor: COLORS.LG_RED,
      color: COLORS.WHITE,
      padding: '8px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(165, 0, 52, 0.2)',
    },
  };

  return (
    <header style={styles.header}>
      <div style={styles.logoArea} onClick={() => setView('dashboard')}>
        <div style={styles.logoIcon}>
          <Bot size={24} />
        </div>
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
  );
};

export default Header;
