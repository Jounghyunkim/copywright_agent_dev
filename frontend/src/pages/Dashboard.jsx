import React from 'react';
import { LayoutDashboard, BarChart3, Globe, Clock, Plus, Search, ChevronRight } from 'lucide-react';
import { COLORS } from '../styles/theme';

// Mock Data for Dashboard
const PAST_PROJECTS = [
  { id: 1, title: 'LG Objet OLED TV Launch', country: 'Germany', date: '2026-03-10', score: 92, status: 'Completed', summary: 'Focused on premium minimalist lifestyle and rational technology benefits.' },
  { id: 2, title: 'InstaView Refrigerator Global', country: 'Global', date: '2026-03-05', score: 88, status: 'In Review', summary: 'Emotional appeal to family health and freshness with multilingual support.' },
  { id: 3, title: 'Gram Pro US Campaign', country: 'USA', date: '2026-02-28', score: 95, status: 'Completed', summary: 'Emphasized extreme portability for Gen Z students and professionals.' },
];

const Dashboard = ({ setView }) => {
  const styles = {
    dashboard: {
      flex: 1,
      overflowY: 'auto',
      padding: '3rem 10%',
      display: 'flex',
      flexDirection: 'column',
      gap: '2.5rem',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1.5rem',
    },
    statCard: {
      backgroundColor: COLORS.WHITE,
      padding: '1.5rem',
      borderRadius: '16px',
      boxShadow: `0 4px 12px ${COLORS.SHADOW}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    projectCard: {
      backgroundColor: COLORS.WHITE,
      padding: '1.5rem',
      borderRadius: '16px',
      boxShadow: `0 2px 8px ${COLORS.SHADOW}`,
      border: `1px solid ${COLORS.BORDER}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer',
    },
     primaryBtn: {
      backgroundColor: COLORS.LG_RED,
      color: COLORS.WHITE,
      padding: '16px',
      borderRadius: '12px',
      border: 'none',
      fontWeight: 700,
      fontSize: '1rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      boxShadow: '0 8px 20px rgba(165, 0, 52, 0.15)',
      transition: 'transform 0.2s ease',
    },
     input: {
      padding: '12px 16px',
      borderRadius: '10px',
      border: `1px solid ${COLORS.BORDER}`,
      fontSize: '0.95rem',
      transition: 'all 0.2s ease',
      outline: 'none',
      backgroundColor: '#FBFBFD'
    },
  };

  return (
    <div style={styles.dashboard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Project Dashboard</h2>
          <p style={{ color: COLORS.TEXT_SUB, margin: '5px 0 0 0' }}>Overview of your AI-driven marketing campaigns.</p>
        </div>
        <button onClick={() => setView('editor')} style={{ ...styles.primaryBtn, padding: '12px 24px', fontSize: '0.9rem' }}>
          <Plus size={18} /> New Campaign
        </button>
      </div>

      <div style={styles.statsGrid}>
        {[
          { label: 'Total Projects', value: '12', icon: LayoutDashboard, color: '#007AFF' },
          { label: 'Avg. Brand Score', value: '91.5%', icon: BarChart3, color: COLORS.SUCCESS },
          { label: 'Target Regions', value: '4', icon: Globe, color: '#FF9500' },
          { label: 'Generation Time', value: '2.4s', icon: Clock, color: '#5856D6' },
        ].map((stat, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.TEXT_SUB }}>{stat.label}</span>
              <stat.icon size={18} color={stat.color} />
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recent Campaigns</h3>
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...styles.input, padding: '8px 12px 8px 35px', width: '250px', fontSize: '0.85rem' }}
              placeholder="Search projects..."
            />
            <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: COLORS.TEXT_SUB }} />
          </div>
        </div>

        {PAST_PROJECTS.map((project) => (
          <div
            key={project.id}
            style={styles.projectCard}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{project.title}</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#F0F0F0', padding: '2px 8px', borderRadius: '10px', color: COLORS.TEXT_SUB }}>
                  {project.country}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: COLORS.TEXT_SUB, maxWidth: '600px' }}>{project.summary}</p>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: COLORS.TEXT_SUB, marginBottom: '2px' }}>Brand Score</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: COLORS.LG_RED }}>{project.score}</div>
              </div>
              <ChevronRight size={20} color={COLORS.BORDER} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
