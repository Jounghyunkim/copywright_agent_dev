import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { COLORS } from '../styles/theme';

const SidebarToggle = ({ isCollapsed, onClick, show }) => {
  if (!show) return null;

  const style = {
    position: 'absolute',
    left: isCollapsed ? '35px' : '435px',
    top: '40px', // Minor adjustment to 40px for perfect centering with 40px height button
    transform: 'translate(-50%, -50%)',
    zIndex: 100,
    height: '40px',
    width: '40px',
    backgroundColor: COLORS.WHITE,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <button style={style} onClick={onClick}>
      {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
    </button>
  );
};

export default SidebarToggle;
