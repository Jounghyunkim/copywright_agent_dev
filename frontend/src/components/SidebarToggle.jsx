import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { COLORS } from '../styles/theme';

const SidebarToggle = ({ isCollapsed, onClick, show }) => {
  if (!show) return null;

  const style = {
    position: 'absolute',
    left: isCollapsed ? '0px' : '420px',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10,
    height: '60px',
    width: '24px',
    backgroundColor: COLORS.WHITE,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '0 8px 8px 0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '4px 0 10px rgba(0,0,0,0.05)',
    transition: 'left 0.3s ease-in-out, transform 0.3s ease-in-out',
  };

  return (
    <button style={style} onClick={onClick}>
      {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
    </button>
  );
};

export default SidebarToggle;
