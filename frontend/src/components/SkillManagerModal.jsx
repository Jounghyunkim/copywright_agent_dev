import React, { useState, useEffect } from 'react';
import { X, Trash2, Loader, AlertCircle, Shield, Puzzle } from 'lucide-react';
import { COLORS } from '../styles/theme';

const SkillManagerModal = ({ onClose }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const fetchSkills = async () => {
    setLoading(true);
    setError('');
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/api/v1/skills`);
      if (!res.ok) throw new Error('스킬 목록을 불러오지 못했습니다.');
      const data = await res.json();
      setSkills(data.skills || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSkills(); }, []);

  const handleDelete = async (skillId) => {
    if (!window.confirm('이 스킬을 삭제하시겠습니까?')) return;
    setDeletingId(skillId);
    setError('');
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/api/v1/skills/${skillId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || '스킬 삭제에 실패했습니다.');
      }
      setSkills(prev => prev.filter(s => s.id !== skillId));
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const categoryLabel = { validation: 'Validation', generation: 'Generation', analysis: 'Analysis' };
  const categoryColor = { validation: '#2563EB', generation: '#7C3AED', analysis: '#D97706' };

  const overlay = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 9999, backdropFilter: 'blur(4px)',
  };
  const modal = {
    backgroundColor: COLORS.WHITE, borderRadius: '20px', width: '620px',
    maxHeight: '80vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
  };
  const header = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '24px 28px 16px', borderBottom: `1px solid ${COLORS.BORDER}`,
  };
  const body = {
    padding: '16px 28px 24px', overflowY: 'auto', flex: 1,
    display: 'flex', flexDirection: 'column', gap: '10px',
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={header}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>스킬 관리</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: COLORS.TEXT_SUB }}>
              등록된 스킬 목록을 확인하고 관리합니다. 빌트인 스킬은 삭제할 수 없습니다.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} color={COLORS.TEXT_SUB} />
          </button>
        </div>

        {/* Body */}
        <div style={body}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
              backgroundColor: '#FEF2F2', borderRadius: '10px', color: '#DC2626', fontSize: '0.83rem',
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: COLORS.TEXT_SUB }}>
              <Loader size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
              <p style={{ margin: 0 }}>스킬 목록 불러오는 중...</p>
            </div>
          ) : skills.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '3rem', color: COLORS.TEXT_SUB,
              borderRadius: '12px', border: `1px dashed ${COLORS.BORDER}`,
            }}>
              <Puzzle size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>등록된 스킬이 없습니다.</p>
            </div>
          ) : (
            skills.map(skill => {
              const isBuiltin = skill.type === 'builtin';
              const catColor = categoryColor[skill.category] || COLORS.TEXT_SUB;
              return (
                <div
                  key={skill.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: '12px',
                    border: `1px solid ${COLORS.BORDER}`, backgroundColor: '#FAFAFA',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FAFAFA')}
                >
                  {/* Left: info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{skill.label}</span>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                        backgroundColor: `${catColor}14`, color: catColor,
                      }}>
                        {categoryLabel[skill.category] || skill.category}
                      </span>
                      {isBuiltin && (
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px', borderRadius: '6px',
                          backgroundColor: '#F0F0F0', color: COLORS.TEXT_SUB,
                          display: 'flex', alignItems: 'center', gap: '3px',
                        }}>
                          <Shield size={10} /> Built-in
                        </span>
                      )}
                    </div>
                    <p style={{
                      margin: '4px 0 0', fontSize: '0.8rem', color: COLORS.TEXT_SUB,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {skill.description}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '2px', display: 'inline-block' }}>
                      {skill.id}
                    </span>
                  </div>

                  {/* Right: delete button */}
                  {!isBuiltin && (
                    <button
                      onClick={() => handleDelete(skill.id)}
                      disabled={deletingId === skill.id}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '8px', borderRadius: '8px', marginLeft: '12px',
                        display: 'flex', alignItems: 'center',
                        transition: 'background-color 0.15s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      title="스킬 삭제"
                    >
                      {deletingId === skill.id
                        ? <Loader size={18} color={COLORS.BORDER} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Trash2 size={18} color="#DC2626" />
                      }
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillManagerModal;
