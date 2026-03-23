import React, { useState } from 'react';
import { X, Wand2, Save, ArrowLeft, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { COLORS } from '../styles/theme';

const SkillBuilderModal = ({ onClose }) => {
  const [step, setStep] = useState('input'); // 'input' | 'review'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: User inputs
  const [purpose, setPurpose] = useState('');
  const [goal, setGoal] = useState('');
  const [goodExample, setGoodExample] = useState('');
  const [badExample, setBadExample] = useState('');

  // Step 2: Generated draft (editable)
  const [draft, setDraft] = useState(null);

  const handleGenerate = async () => {
    if (!purpose.trim() || !goal.trim()) return;
    setLoading(true);
    setError('');
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/api/v1/skills/generate-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: purpose.trim(),
          goal: goal.trim(),
          goodExample: goodExample.trim() || null,
          badExample: badExample.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('초안 생성에 실패했습니다.');
      const data = await res.json();
      setDraft(data.data);
      setStep('review');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/api/v1/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || '스킬 저장에 실패했습니다.');
      }
      setSuccess('스킬이 성공적으로 등록되었습니다!');
      setTimeout(() => onClose(), 1500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const overlay = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 9999, backdropFilter: 'blur(4px)',
  };
  const modal = {
    backgroundColor: COLORS.WHITE, borderRadius: '20px', width: '680px',
    maxHeight: '85vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
  };
  const header = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '24px 28px 16px', borderBottom: `1px solid ${COLORS.BORDER}`,
  };
  const body = {
    padding: '24px 28px', overflowY: 'auto', flex: 1,
    display: 'flex', flexDirection: 'column', gap: '20px',
  };
  const footer = {
    padding: '16px 28px', borderTop: `1px solid ${COLORS.BORDER}`,
    display: 'flex', justifyContent: 'flex-end', gap: '12px',
  };
  const labelStyle = {
    fontSize: '0.85rem', fontWeight: 700, color: COLORS.TEXT_MAIN,
    marginBottom: '6px', display: 'block',
  };
  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: `1px solid ${COLORS.BORDER}`, fontSize: '0.85rem',
    fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };
  const textareaStyle = {
    ...inputStyle, minHeight: '80px', resize: 'vertical', lineHeight: 1.5,
  };
  const hintStyle = {
    fontSize: '0.75rem', color: COLORS.TEXT_SUB, marginTop: '4px',
  };
  const btnPrimary = {
    backgroundColor: COLORS.LG_RED, color: COLORS.WHITE,
    padding: '10px 22px', borderRadius: '10px', border: 'none',
    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit',
  };
  const btnSecondary = {
    backgroundColor: '#F3F4F6', color: COLORS.TEXT_MAIN,
    padding: '10px 22px', borderRadius: '10px', border: 'none',
    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit',
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {step === 'review' && (
              <button onClick={() => setStep('input')} style={{ ...btnSecondary, padding: '6px 10px' }}>
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                {step === 'input' ? '스킬 작성' : '초안 검토'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: COLORS.TEXT_SUB }}>
                {step === 'input'
                  ? '핵심 정보만 입력하면 나머지는 자동으로 초안이 생성됩니다.'
                  : 'AI가 생성한 초안을 검토하고 필요 시 수정하세요.'}
              </p>
            </div>
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
          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
              backgroundColor: '#F0FDF4', borderRadius: '10px', color: '#16A34A', fontSize: '0.83rem',
            }}>
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          {step === 'input' ? (
            <>
              {/* 작성 목적 */}
              <div>
                <label style={labelStyle}>작성 목적 <span style={{ color: COLORS.LG_RED }}>*</span></label>
                <input
                  style={inputStyle}
                  placeholder="예: Q2 프로모션 카피 품질 점검 스킬"
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = COLORS.LG_RED)}
                  onBlur={e => (e.target.style.borderColor = COLORS.BORDER)}
                />
                <div style={hintStyle}>이 스킬을 왜 만드는지 한 줄로 설명</div>
              </div>

              {/* 스킬 목적 */}
              <div>
                <label style={labelStyle}>스킬 목적 <span style={{ color: COLORS.LG_RED }}>*</span></label>
                <textarea
                  style={textareaStyle}
                  placeholder="예: 프로모션 카피에서 할인율 표현이 법적 기준을 충족하는지 검증하고, 과장 표현을 탐지한다."
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = COLORS.LG_RED)}
                  onBlur={e => (e.target.style.borderColor = COLORS.BORDER)}
                />
                <div style={hintStyle}>이 스킬이 해결하려는 문제와 기대 결과를 서술</div>
              </div>

              {/* 좋은 예시 */}
              <div>
                <label style={labelStyle}>좋은 예시</label>
                <textarea
                  style={textareaStyle}
                  placeholder="예: 입력: '최대 30% 할인' → 결과: 적합, 법적 근거 확인됨"
                  value={goodExample}
                  onChange={e => setGoodExample(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = COLORS.LG_RED)}
                  onBlur={e => (e.target.style.borderColor = COLORS.BORDER)}
                />
                <div style={hintStyle}>올바르게 동작하는 입력/결과 사례 (선택)</div>
              </div>

              {/* 나쁜 예시 */}
              <div>
                <label style={labelStyle}>나쁜 예시</label>
                <textarea
                  style={textareaStyle}
                  placeholder="예: 입력: '업계 최저가 보장' → 결과: 부적합, 근거 없는 최상급 표현"
                  value={badExample}
                  onChange={e => setBadExample(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = COLORS.LG_RED)}
                  onBlur={e => (e.target.style.borderColor = COLORS.BORDER)}
                />
                <div style={hintStyle}>잘못된 동작이나 피해야 할 패턴 (선택)</div>
              </div>

              <div style={{
                padding: '12px 14px', backgroundColor: '#F8F9FA', borderRadius: '10px',
                fontSize: '0.78rem', color: COLORS.TEXT_SUB, lineHeight: 1.6,
              }}>
                스킬 식별자, 입력/출력 정의, 실행 단계, 예외 처리, HITL 규칙은 위 정보를 기반으로 자동 생성됩니다.
                초안 검토 단계에서 확인하고 수정할 수 있습니다.
              </div>
            </>
          ) : draft ? (
            <>
              {/* Draft review fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>스킬 ID</label>
                  <input
                    style={inputStyle}
                    value={draft.id || ''}
                    onChange={e => updateDraft('id', e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>카테고리</label>
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={draft.category || 'validation'}
                    onChange={e => updateDraft('category', e.target.value)}
                  >
                    <option value="validation">Validation</option>
                    <option value="generation">Generation</option>
                    <option value="analysis">Analysis</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>스킬 이름</label>
                <input
                  style={inputStyle}
                  value={draft.label || ''}
                  onChange={e => updateDraft('label', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>설명</label>
                <textarea
                  style={{ ...textareaStyle, minHeight: '60px' }}
                  value={draft.description || ''}
                  onChange={e => updateDraft('description', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>프롬프트 템플릿</label>
                <textarea
                  style={{ ...textareaStyle, minHeight: '200px', fontSize: '0.8rem', fontFamily: 'monospace' }}
                  value={draft.prompt_template || ''}
                  onChange={e => updateDraft('prompt_template', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>출력 스키마 (JSON)</label>
                <textarea
                  style={{ ...textareaStyle, minHeight: '120px', fontSize: '0.8rem', fontFamily: 'monospace' }}
                  value={typeof draft.output_schema === 'string' ? draft.output_schema : JSON.stringify(draft.output_schema, null, 2)}
                  onChange={e => {
                    try {
                      updateDraft('output_schema', JSON.parse(e.target.value));
                    } catch {
                      // keep raw string while editing
                    }
                  }}
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div style={footer}>
          <button onClick={onClose} style={btnSecondary}>취소</button>
          {step === 'input' ? (
            <button
              onClick={handleGenerate}
              disabled={loading || !purpose.trim() || !goal.trim()}
              style={{
                ...btnPrimary,
                opacity: loading || !purpose.trim() || !goal.trim() ? 0.5 : 1,
                cursor: loading || !purpose.trim() || !goal.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Wand2 size={16} />}
              {loading ? '초안 생성 중...' : '초안 생성'}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ ...btnPrimary, opacity: saving ? 0.5 : 1 }}
            >
              {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              {saving ? '저장 중...' : '스킬 등록'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillBuilderModal;
