import React, { useState, useRef, useEffect } from 'react';
import { Bot, Search, Settings, PenTool, ListChecks } from 'lucide-react';
import { COLORS } from '../styles/theme';

const Header = ({ setView, backendConnected = true, onOpenSkillBuilder, onOpenSkillManager }) => {
  const statusColor = backendConnected ? COLORS.SUCCESS : COLORS.LG_RED;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

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
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      backgroundColor: statusColor,
      boxShadow: `0 0 6px ${statusColor}`,
      transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
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
            <span style={{ fontSize: '0.7rem', color: COLORS.TEXT_SUB }}>Backend Health: </span>
            <div style={styles.statusDot} title={backendConnected ? 'Backend connected' : 'Backend disconnected'} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.TEXT_SUB, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={16} /> Knowledge Base Ready
        </div>
        <div style={{ height: '24px', width: '1px', backgroundColor: COLORS.BORDER }}></div>

        {/* Settings with dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <Settings
            style={{
              cursor: 'pointer',
              color: menuOpen ? COLORS.LG_RED : COLORS.TEXT_SUB,
              transition: 'color 0.2s, transform 0.3s',
              transform: menuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
            size={20}
            onClick={() => setMenuOpen(!menuOpen)}
          />
          {menuOpen && (
            <div style={{
              position: 'absolute', top: '36px', right: 0, minWidth: '200px',
              backgroundColor: COLORS.WHITE, borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: `1px solid ${COLORS.BORDER}`,
              padding: '6px', zIndex: 200, animation: 'fadeIn 0.15s ease',
            }}>
              {[
                { label: '스킬 작성', icon: PenTool, onClick: onOpenSkillBuilder },
                { label: '스킬 관리', icon: ListChecks, onClick: onOpenSkillManager },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => { setMenuOpen(false); item.onClick?.(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', border: 'none', background: 'none',
                    borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem',
                    fontWeight: 600, color: COLORS.TEXT_MAIN, fontFamily: 'inherit',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <item.icon size={16} color={COLORS.LG_RED} />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
