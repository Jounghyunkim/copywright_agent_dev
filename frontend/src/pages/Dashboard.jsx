import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BarChart3, Globe, Clock, Plus, Search, ChevronRight, FileText, Loader, Trash2 } from 'lucide-react';
import { COLORS } from '../styles/theme';

const COUNTRY_FLAGS = {
  US: '🇺🇸', DE: '🇩🇪', GB: '🇬🇧', FR: '🇫🇷', IT: '🇮🇹', ES: '🇪🇸',
  IN: '🇮🇳', BR: '🇧🇷', KR: '🇰🇷', AU: '🇦🇺', ID: '🇮🇩', SA: '🇸🇦',
};

const Dashboard = ({ setView, onOpenCampaign }) => {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${apiBase}/api/v1/campaigns/dashboard`);
        if (res.ok) {
          const data = await res.json();
          setDashData(data);
        }
      } catch (e) {
        console.error('Dashboard fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const stats = dashData?.stats || { totalProjects: 0, avgBrandScore: 0, avgReviewScore: 0, targetRegions: 0 };
  const campaigns = dashData?.campaigns || [];

  const filtered = searchQuery.trim()
    ? campaigns.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : campaigns;

  const handleDelete = async (e, campaignId) => {
    e.stopPropagation();
    if (!window.confirm('이 캠페인을 삭제하시겠습니까?')) return;
    setDeletingId(campaignId);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/api/v1/campaigns/${campaignId}`, { method: 'DELETE' });
      if (res.ok) {
        setDashData(prev => ({
          ...prev,
          campaigns: prev.campaigns.filter(c => c.id !== campaignId),
        }));
        setExpandedId(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const styles = {
    dashboard: {
      flex: 1, overflowY: 'auto', padding: '3rem 10%',
      display: 'flex', flexDirection: 'column', gap: '2.5rem',
    },
    statsGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem',
    },
    statCard: {
      backgroundColor: COLORS.WHITE, padding: '1.5rem', borderRadius: '16px',
      boxShadow: `0 4px 12px ${COLORS.SHADOW}`,
      display: 'flex', flexDirection: 'column', gap: '10px',
    },
    projectCard: {
      backgroundColor: COLORS.WHITE, padding: '1.5rem', borderRadius: '16px',
      boxShadow: `0 2px 8px ${COLORS.SHADOW}`, border: `1px solid ${COLORS.BORDER}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer',
    },
    primaryBtn: {
      backgroundColor: COLORS.LG_RED, color: COLORS.WHITE,
      padding: '12px 24px', borderRadius: '12px', border: 'none',
      fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
      boxShadow: '0 8px 20px rgba(165, 0, 52, 0.15)', transition: 'transform 0.2s ease',
      fontFamily: 'inherit',
    },
    input: {
      padding: '8px 12px 8px 35px', width: '250px', borderRadius: '10px',
      border: `1px solid ${COLORS.BORDER}`, fontSize: '0.85rem',
      transition: 'all 0.2s ease', outline: 'none', backgroundColor: '#FBFBFD',
      fontFamily: 'inherit',
    },
  };

  const statItems = [
    { label: 'Total Projects', value: stats.totalProjects, icon: LayoutDashboard, color: '#007AFF' },
    { label: 'Avg. Brand Score', value: stats.avgBrandScore > 0 ? `${stats.avgBrandScore}` : '—', icon: BarChart3, color: COLORS.SUCCESS },
    { label: 'Target Regions', value: stats.targetRegions, icon: Globe, color: '#FF9500' },
    { label: 'Avg. Review Score', value: stats.avgReviewScore > 0 ? `${stats.avgReviewScore}` : '—', icon: Clock, color: '#5856D6' },
  ];

  return (
    <div style={styles.dashboard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Project Dashboard</h2>
          <p style={{ color: COLORS.TEXT_SUB, margin: '5px 0 0 0' }}>Overview of your AI-driven marketing campaigns.</p>
        </div>
        <button onClick={() => setView('editor')} style={styles.primaryBtn}>
          <Plus size={18} /> New Campaign
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        {statItems.map((stat, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.TEXT_SUB }}>{stat.label}</span>
              <stat.icon size={18} color={stat.color} />
            </div>
            <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {loading ? <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: COLORS.TEXT_SUB }} /> : stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Campaign List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recent Campaigns</h3>
          <div style={{ position: 'relative' }}>
            <input
              style={styles.input}
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: COLORS.TEXT_SUB }} />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: COLORS.TEXT_SUB }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <p style={{ margin: 0 }}>캠페인 목록을 불러오는 중...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem', color: COLORS.TEXT_SUB,
            backgroundColor: COLORS.WHITE, borderRadius: '16px', border: `1px dashed ${COLORS.BORDER}`,
          }}>
            <FileText size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>
              {searchQuery ? '검색 결과가 없습니다.' : '저장된 캠페인이 없습니다.'}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
              {searchQuery ? '다른 키워드로 검색해 보세요.' : 'New Campaign 버튼을 눌러 첫 캠페인을 시작하세요.'}
            </p>
          </div>
        ) : (
          filtered.map((project) => (
            <div
              key={project.id}
              style={styles.projectCard}
              onClick={() => onOpenCampaign?.(project.id)}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{project.title}</span>
                  {(project.countries || []).map(cc => (
                    <span key={cc} style={{
                      fontSize: '0.75rem', backgroundColor: '#F0F0F0', padding: '2px 8px',
                      borderRadius: '10px', color: COLORS.TEXT_SUB,
                    }}>
                      {COUNTRY_FLAGS[cc] || '🌐'} {cc}
                    </span>
                  ))}
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                    backgroundColor: '#E8F5E9', color: '#2E7D32', marginLeft: '4px',
                  }}>{project.totalCopies} copies</span>
                </div>
                <p style={{
                  margin: 0, fontSize: '0.85rem', color: COLORS.TEXT_SUB,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px',
                }}>
                  {project.summary || '—'}
                </p>
                <span style={{ fontSize: '0.72rem', color: COLORS.TEXT_SUB, marginTop: '4px', display: 'inline-block' }}>
                  {project.date}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: COLORS.TEXT_SUB, marginBottom: '2px' }}>Brand Fit</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: COLORS.LG_RED }}>{project.brandFitScore || '—'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: COLORS.TEXT_SUB, marginBottom: '2px' }}>Review</div>
                  <div style={{
                    fontSize: '1.1rem', fontWeight: 800,
                    color: (project.reviewAvgScore || 0) >= 70 ? '#16A34A' : (project.reviewAvgScore || 0) >= 40 ? '#A16207' : '#DC2626',
                  }}>{project.reviewAvgScore || '—'}</div>
                </div>
                <div
                  onClick={e => { e.stopPropagation(); setExpandedId(expandedId === project.id ? null : project.id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <ChevronRight
                    size={20}
                    color={COLORS.BORDER}
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: expandedId === project.id ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  />
                  {expandedId === project.id && (
                    <button
                      onClick={e => handleDelete(e, project.id)}
                      disabled={deletingId === project.id}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      title="캠페인 삭제"
                    >
                      <Trash2 size={18} color={deletingId === project.id ? COLORS.BORDER : '#DC2626'} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
