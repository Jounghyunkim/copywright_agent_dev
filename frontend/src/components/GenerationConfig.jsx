import React, { useState, useEffect } from 'react';
import { Globe, Users, UserCheck, Cpu, ArrowRight, Loader, Sparkles } from 'lucide-react';
import { COLORS } from '../styles/theme';
import { useT } from '../shared/i18n/useTranslation';

const COUNTRIES = [
    { code: 'US', label: 'USA', flag: '🇺🇸' },
    { code: 'DE', label: 'Germany', flag: '🇩🇪' },
    { code: 'GB', label: 'UK', flag: '🇬🇧' },
    { code: 'FR', label: 'France', flag: '🇫🇷' },
    { code: 'IT', label: 'Italy', flag: '🇮🇹' },
    { code: 'ES', label: 'Spain', flag: '🇪🇸' },
    { code: 'JP', label: 'Japan', flag: '🇯🇵' },
    { code: 'CN', label: 'China', flag: '🇨🇳' },
    { code: 'IN', label: 'India', flag: '🇮🇳' },
    { code: 'BR', label: 'Brazil', flag: '🇧🇷' },
    { code: 'KR', label: 'Korea', flag: '🇰🇷' },
    { code: 'AU', label: 'Australia', flag: '🇦🇺' },
    { code: 'ID', label: 'Indonesia', flag: '🇮🇩' },
    { code: 'TH', label: 'Thailand', flag: '🇹🇭' },
    { code: 'SA', label: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'NL', label: 'Netherlands', flag: '🇳🇱' },
    { code: 'SE', label: 'Sweden', flag: '🇸🇪' },
    { code: 'PL', label: 'Poland', flag: '🇵🇱' },
    { code: 'MX', label: 'Mexico', flag: '🇲🇽' },
    { code: 'CA', label: 'Canada', flag: '🇨🇦' },
];

const AGE_GROUPS = [
    { id: '18-24', label: '18–24' },
    { id: '25-34', label: '25–34' },
    { id: '35-44', label: '35–44' },
    { id: '45-54', label: '45–54' },
    { id: '55+', label: '55+' },
];

// 타겟 페르소나 (소비자 유형) — 기존 호환
const TARGET_PERSONAS = [
    { id: 'tech-enthusiast', label: 'Tech Enthusiast', desc: '최신 기술에 민감한 얼리어답터' },
    { id: 'premium-lifestyle', label: 'Premium Lifestyle', desc: '프리미엄 라이프스타일 지향' },
    { id: 'value-seeker', label: 'Value Seeker', desc: '가성비를 중시하는 합리적 소비자' },
    { id: 'family-first', label: 'Family First', desc: '가족 중심의 실용적 소비자' },
    { id: 'eco-conscious', label: 'Eco Conscious', desc: '환경과 지속가능성에 관심' },
];

// 아바타 키워드 → 이모지 매핑 (SKILL.md의 Persona Config에서 키워드로 저장됨)
const AVATAR_EMOJI_MAP = {
    'exclamation': '🔥', 'glasses': '🔬', 'wink': '😄', 'beret': '🎨',
    'pen': '✒️', 'crown': '👑', 'star': '⭐', 'book': '📖',
    'clock': '⏰', 'lightning': '⚡', 'heart': '❤️', 'rocket': '🚀',
    'mic': '🎤', 'trophy': '🏆', 'palette': '🎨', 'megaphone': '📢',
};

function resolveAvatar(avatar) {
    if (!avatar) return '✍️';
    // 이미 이모지면 그대로 반환
    if (/\p{Emoji}/u.test(avatar) && avatar.length <= 4) return avatar;
    // 키워드 매핑
    return AVATAR_EMOJI_MAP[avatar.toLowerCase()] || '✍️';
}

// SKILLSETS removed — all skills now loaded from SKILL.md via API

const GenerationConfig = ({ onSubmit, isGenerating = false, aiPersonas = null }) => {
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [selectedAges, setSelectedAges] = useState([]);
    const [selectedPersonas, setSelectedPersonas] = useState([]);
    const [selectedWriters, setSelectedWriters] = useState([]);
    const [copyCount, setCopyCount] = useState(3);
    const [usePersonaMode, setUsePersonaMode] = useState(false);
    const t = useT();

    // AI Writer 페르소나 목록 (API에서 전달받거나 직접 fetch)
    const [writerPersonas, setWriterPersonas] = useState(aiPersonas || []);

    useEffect(() => {
        if (aiPersonas && aiPersonas.length > 0) {
            setWriterPersonas(aiPersonas);
            return;
        }
        if (aiPersonas && aiPersonas.length === 0) {
            setWriterPersonas([]);
            setUsePersonaMode(false);
            return;
        }
        // fallback: 직접 API 호출
        const fetchPersonas = async () => {
            try {
                const apiBase = import.meta.env.VITE_API_BASE_URL || '';
                const res = await fetch(`${apiBase}/api/v1/personas`);
                if (res.ok) {
                    const data = await res.json();
                    const personas = data.data || [];
                    setWriterPersonas(personas);
                    if (personas.length === 0) setUsePersonaMode(false);
                }
            } catch (e) {
                console.error('Failed to load AI personas:', e);
                setUsePersonaMode(false);
            }
        };
        fetchPersonas();
    }, [aiPersonas]);

    const toggleItem = (list, setList, id) => {
        setList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleAllCountries = () => {
        setSelectedCountries(prev => prev.length === COUNTRIES.length ? [] : COUNTRIES.map(c => c.code));
    };

    const canSubmit = selectedCountries.length > 0 && selectedAges.length > 0 && selectedPersonas.length > 0 && (!usePersonaMode || selectedWriters.length > 0) && !isGenerating;

    const handleSubmit = () => {
        if (!canSubmit) return;
        onSubmit({
            countries: selectedCountries,
            ageGroups: selectedAges,
            personas: selectedPersonas,
            skillsets: [],
            copyCount,
            // 새로운 필드: AI Writer 페르소나 모드
            usePersonaMode,
            selectedWriters: usePersonaMode ? selectedWriters : [],
        });
    };

    const styles = {
        container: {
            padding: '1.5rem',
            borderRadius: '20px',
            backgroundColor: 'rgba(240, 240, 240, 0.5)',
            border: `1px solid ${COLORS.BORDER}`,
            marginTop: '1.5rem',
        },
        header: {
            fontSize: '1.1rem', fontWeight: 800, color: COLORS.TEXT_MAIN,
            marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px',
        },
        subheader: {
            fontSize: '0.85rem', color: COLORS.TEXT_SUB, marginBottom: '1.5rem', lineHeight: 1.5,
        },
        sectionTitle: {
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '0.82rem', fontWeight: 700, color: COLORS.TEXT_SUB,
            textTransform: 'uppercase', letterSpacing: '0.5px',
            marginBottom: '0.75rem', marginTop: '1.5rem',
        },
        sectionTitleFirst: {
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '0.82rem', fontWeight: 700, color: COLORS.TEXT_SUB,
            textTransform: 'uppercase', letterSpacing: '0.5px',
            marginBottom: '0.75rem', marginTop: 0,
        },
        countryGrid: {
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
        },
        checkbox: (checked) => ({
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
            border: `1.5px solid ${checked ? COLORS.LG_RED : COLORS.BORDER}`,
            backgroundColor: checked ? '#FFF0F3' : COLORS.WHITE,
            transition: 'all 0.15s ease', fontSize: '0.85rem', fontWeight: 500,
            color: checked ? COLORS.LG_RED : COLORS.TEXT_MAIN,
        }),
        checkMark: (checked) => ({
            width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
            border: `1.5px solid ${checked ? COLORS.LG_RED : COLORS.BORDER}`,
            backgroundColor: checked ? COLORS.LG_RED : COLORS.WHITE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: COLORS.WHITE, fontSize: '10px', fontWeight: 700,
        }),
        ageGrid: {
            display: 'flex', flexWrap: 'wrap', gap: '8px',
        },
        personaCard: (checked) => ({
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
            border: `1.5px solid ${checked ? COLORS.LG_RED : COLORS.BORDER}`,
            backgroundColor: checked ? '#FFF0F3' : COLORS.WHITE,
            transition: 'all 0.15s ease',
        }),
        personaInfo: {
            flex: 1,
        },
        personaLabel: (checked) => ({
            fontSize: '0.88rem', fontWeight: 600,
            color: checked ? COLORS.LG_RED : COLORS.TEXT_MAIN, margin: 0,
        }),
        personaDesc: {
            fontSize: '0.78rem', color: COLORS.TEXT_SUB, margin: '2px 0 0 0',
        },
        writerCard: (checked, color) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '12px', cursor: 'pointer',
            border: `1.5px solid ${checked ? (color || COLORS.LG_RED) : COLORS.BORDER}`,
            backgroundColor: checked ? `${color || COLORS.LG_RED}10` : COLORS.WHITE,
            transition: 'all 0.15s ease',
            minHeight: '56px',
        }),
        writerAvatar: {
            fontSize: '1.3rem', width: '32px', height: '32px', borderRadius: '8px',
            backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
        },
        writerInfo: {
            flex: 1, minWidth: 0, overflow: 'hidden',
        },
        writerName: (checked, color) => ({
            fontSize: '0.82rem', fontWeight: 600,
            color: checked ? (color || COLORS.LG_RED) : COLORS.TEXT_MAIN,
            margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }),
        writerTags: {
            display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '3px',
        },
        writerTag: {
            fontSize: '0.6rem', fontWeight: 600, padding: '1px 5px', borderRadius: '4px',
            backgroundColor: '#F3F4F6', color: COLORS.TEXT_SUB,
        },
        submitRow: {
            display: 'flex', alignItems: 'center', gap: '12px', marginTop: '1.5rem',
        },
        copyCountGroup: {
            display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
        },
        copyCountLabel: {
            fontSize: '0.85rem', fontWeight: 600, color: COLORS.TEXT_MAIN, whiteSpace: 'nowrap',
        },
        copyCountInput: {
            width: '60px', padding: '10px 8px', borderRadius: '10px', textAlign: 'center',
            border: `1.5px solid ${COLORS.BORDER}`, fontSize: '1rem', fontWeight: 700,
            color: COLORS.TEXT_MAIN, outline: 'none', fontFamily: 'inherit',
            backgroundColor: COLORS.WHITE,
        },
        submitBtn: (enabled) => ({
            flex: 1, padding: '16px', borderRadius: '14px', border: 'none',
            fontWeight: 700, fontSize: '1rem', cursor: enabled ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            backgroundColor: enabled ? COLORS.LG_RED : '#E0E0E0',
            color: COLORS.WHITE,
            boxShadow: enabled ? '0 8px 20px rgba(165, 0, 52, 0.25)' : 'none',
            transition: 'all 0.2s ease',
        }),
        selectAll: {
            fontSize: '0.78rem', color: COLORS.LG_RED, cursor: 'pointer',
            fontWeight: 600, marginLeft: 'auto', border: 'none',
            backgroundColor: 'transparent', padding: 0, fontFamily: 'inherit',
        },
        divider: {
            borderTop: `1px solid ${COLORS.BORDER}`, margin: '1.5rem 0 0 0',
        },
        modeToggle: (active) => ({
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', borderRadius: '12px', cursor: 'pointer',
            border: `1.5px solid ${active ? '#7C3AED' : COLORS.BORDER}`,
            backgroundColor: active ? '#F5F3FF' : COLORS.WHITE,
            transition: 'all 0.15s ease', marginBottom: '12px',
        }),
    };

    return (
        <div style={styles.container}>
            <h3 style={styles.header}>
                <Cpu size={22} color={COLORS.LG_RED} />{t('gen.title')}
            </h3>
            <p style={styles.subheader}>
                {t('gen.desc')}
            </p>

            {/* Countries */}
            <div style={styles.sectionTitleFirst}>
                <Globe size={14} />{t('gen.targetCountries')}
                <button style={styles.selectAll} onClick={toggleAllCountries}>
                    {selectedCountries.length === COUNTRIES.length ? t('gen.deselectAll') : t('gen.selectAll')}
                </button>
            </div>
            <div style={styles.countryGrid}>
                {COUNTRIES.map(c => (
                    <div
                        key={c.code}
                        style={styles.checkbox(selectedCountries.includes(c.code))}
                        onClick={() => toggleItem(selectedCountries, setSelectedCountries, c.code)}
                    >
                        <div style={styles.checkMark(selectedCountries.includes(c.code))}>
                            {selectedCountries.includes(c.code) && '✓'}
                        </div>
                        <span>{c.flag}</span>
                        <span>{c.label}</span>
                    </div>
                ))}
            </div>

            <div style={styles.divider} />

            {/* Age Groups */}
            <div style={styles.sectionTitle}>
                <Users size={14} />{t('gen.targetAgeGroups')}
            </div>
            <div style={styles.ageGrid}>
                {AGE_GROUPS.map(a => (
                    <div
                        key={a.id}
                        style={styles.checkbox(selectedAges.includes(a.id))}
                        onClick={() => toggleItem(selectedAges, setSelectedAges, a.id)}
                    >
                        <div style={styles.checkMark(selectedAges.includes(a.id))}>
                            {selectedAges.includes(a.id) && '✓'}
                        </div>
                        <span>{a.label}</span>
                    </div>
                ))}
            </div>

            <div style={styles.divider} />

            {/* Target Personas */}
            <div style={styles.sectionTitle}>
                <UserCheck size={14} />{t('gen.targetPersonas')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {TARGET_PERSONAS.map(p => (
                    <div
                        key={p.id}
                        style={styles.personaCard(selectedPersonas.includes(p.id))}
                        onClick={() => toggleItem(selectedPersonas, setSelectedPersonas, p.id)}
                    >
                        <div style={{ ...styles.checkMark(selectedPersonas.includes(p.id)), marginTop: '2px' }}>
                            {selectedPersonas.includes(p.id) && '✓'}
                        </div>
                        <div style={styles.personaInfo}>
                            <p style={styles.personaLabel(selectedPersonas.includes(p.id))}>{p.label}</p>
                            <p style={styles.personaDesc}>{p.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div style={styles.divider} />

            {/* AI Writer Personas */}
            {writerPersonas.length > 0 && (
                <>
                    <div style={styles.sectionTitle}>
                        <Sparkles size={14} />{t('gen.aiWriterPersonas')}
                        <span style={{ fontSize: '0.7rem', color: COLORS.TEXT_SUB, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                            {t('gen.aiWriterDesc')}
                        </span>
                    </div>

                    {/* Persona mode toggle */}
                    <div
                        style={styles.modeToggle(usePersonaMode)}
                        onClick={() => setUsePersonaMode(!usePersonaMode)}
                    >
                        <div style={{
                            width: '40px', height: '22px', borderRadius: '11px',
                            backgroundColor: usePersonaMode ? '#7C3AED' : '#D1D5DB',
                            position: 'relative', transition: 'background-color 0.2s ease',
                            flexShrink: 0,
                        }}>
                            <div style={{
                                width: '18px', height: '18px', borderRadius: '50%',
                                backgroundColor: '#FFF', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                position: 'absolute', top: '2px',
                                left: usePersonaMode ? '20px' : '2px', transition: 'left 0.2s ease',
                            }} />
                        </div>
                        <div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: usePersonaMode ? '#7C3AED' : COLORS.TEXT_MAIN }}>
                                {t('gen.personaMode')}
                            </span>
                            <p style={{ fontSize: '0.75rem', color: COLORS.TEXT_SUB, margin: '2px 0 0 0' }}>
                                {t('gen.personaModeDesc')}
                            </p>
                        </div>
                    </div>

                    {usePersonaMode && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {writerPersonas.map(w => (
                                <div
                                    key={w.id}
                                    style={styles.writerCard(selectedWriters.includes(w.id), w.color)}
                                    onClick={() => toggleItem(selectedWriters, setSelectedWriters, w.id)}
                                >
                                    <div style={styles.writerAvatar}>{resolveAvatar(w.avatar)}</div>
                                    <div style={styles.writerInfo}>
                                        <p style={styles.writerName(selectedWriters.includes(w.id), w.color)}>
                                            {w.name || w.id}
                                        </p>
                                        <div style={styles.writerTags}>
                                            {(w.tags || []).map(tag => (
                                                <span key={tag} style={styles.writerTag}>{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ ...styles.checkMark(selectedWriters.includes(w.id)), marginTop: '2px' }}>
                                        {selectedWriters.includes(w.id) && '✓'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Submit */}
            <div style={styles.submitRow}>
                <div style={styles.copyCountGroup}>
                    <span style={styles.copyCountLabel}>{t('gen.copyCount')}</span>
                    <input
                        type="number"
                        min={1}
                        max={10}
                        value={copyCount}
                        onChange={e => {
                            const v = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                            setCopyCount(v);
                        }}
                        style={styles.copyCountInput}
                    />
                </div>
                <button style={styles.submitBtn(canSubmit)} onClick={handleSubmit} disabled={!canSubmit}>
                    {isGenerating ? (
                        <>
                            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                            {t('gen.generating')}
                        </>
                    ) : usePersonaMode && selectedWriters.length > 0 ? (
                        <>
                            <Sparkles size={18} />
                            {t('gen.generateWithWriters', { n: selectedWriters.length })}
                        </>
                    ) : (
                        <>
                            <ArrowRight size={18} />
                            {t('gen.generateCopy')}
                        </>
                    )}
                </button>
            </div>
            {!canSubmit && !isGenerating && (
                <p style={{ fontSize: '0.78rem', color: '#B45309', textAlign: 'center', marginTop: '8px' }}>
                    {usePersonaMode && selectedWriters.length === 0
                        ? t('gen.validationMsgWriter')
                        : t('gen.validationMsg')}
                </p>
            )}
        </div>
    );
};

export default GenerationConfig;
