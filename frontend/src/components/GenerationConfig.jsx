import React, { useState } from 'react';
import { Globe, Users, UserCheck, Cpu, ArrowRight, Loader } from 'lucide-react';
import { COLORS } from '../styles/theme';

const COUNTRIES = [
    { code: 'US', label: 'USA', flag: '🇺🇸' },
    { code: 'DE', label: 'Germany', flag: '🇩🇪' },
    { code: 'GB', label: 'UK', flag: '🇬🇧' },
    { code: 'FR', label: 'France', flag: '🇫🇷' },
    { code: 'IT', label: 'Italy', flag: '🇮🇹' },
    { code: 'ES', label: 'Spain', flag: '🇪🇸' },
    { code: 'IN', label: 'India', flag: '🇮🇳' },
    { code: 'BR', label: 'Brazil', flag: '🇧🇷' },
    { code: 'KR', label: 'Korea', flag: '🇰🇷' },
    { code: 'AU', label: 'Australia', flag: '🇦🇺' },
    { code: 'ID', label: 'Indonesia', flag: '🇮🇩' },
    { code: 'SA', label: 'Saudi Arabia', flag: '🇸🇦' },
];

const AGE_GROUPS = [
    { id: '18-24', label: '18–24' },
    { id: '25-34', label: '25–34' },
    { id: '35-44', label: '35–44' },
    { id: '45-54', label: '45–54' },
    { id: '55+', label: '55+' },
];

const PERSONAS = [
    { id: 'tech-enthusiast', label: 'Tech Enthusiast', desc: '최신 기술에 민감한 얼리어답터' },
    { id: 'premium-lifestyle', label: 'Premium Lifestyle', desc: '프리미엄 라이프스타일 지향' },
    { id: 'value-seeker', label: 'Value Seeker', desc: '가성비를 중시하는 합리적 소비자' },
    { id: 'family-first', label: 'Family First', desc: '가족 중심의 실용적 소비자' },
    { id: 'eco-conscious', label: 'Eco Conscious', desc: '환경과 지속가능성에 관심' },
];

export const SKILLSETS = [
    { id: 'ai-washing-risk-check', label: 'AI Washing Risk Check', desc: 'AI 관련 과장/오해 소지 표현 감지' },
    { id: 'brand-lexicon-check', label: 'Brand Lexicon Check', desc: 'LG 브랜드 용어 가이드라인 준수 검증' },
    { id: 'campaign-brief-normalizer', label: 'Campaign Brief Normalizer', desc: '브리프 항목 표준화 및 일관성 검증' },
    { id: 'channel-variant-generator', label: 'Channel Variant Generator', desc: '채널별(SNS, 배너, 영상 등) 카피 변형 생성' },
    { id: 'cultural-sensitivity-check', label: 'Cultural Sensitivity Check', desc: '문화적 민감성 및 현지화 적합성 검증' },
    { id: 'tone-consistency-guard', label: 'Tone Consistency Guard', desc: '톤 앤 매너 일관성 유지 검증' },
];

const GenerationConfig = ({ onSubmit, isGenerating = false }) => {
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [selectedAges, setSelectedAges] = useState([]);
    const [selectedPersonas, setSelectedPersonas] = useState([]);
    const [copyCount, setCopyCount] = useState(3);

    const toggleItem = (list, setList, id) => {
        setList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleAllCountries = () => {
        setSelectedCountries(prev => prev.length === COUNTRIES.length ? [] : COUNTRIES.map(c => c.code));
    };

    const canSubmit = selectedCountries.length > 0 && selectedAges.length > 0 && selectedPersonas.length > 0 && !isGenerating;

    const handleSubmit = () => {
        if (!canSubmit) return;
        onSubmit({
            countries: selectedCountries,
            ageGroups: selectedAges,
            personas: selectedPersonas,
            skillsets: [],
            copyCount,
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
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
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
    };

    return (
        <div style={styles.container}>
            <h3 style={styles.header}>
                <Cpu size={22} color={COLORS.LG_RED} />Copy Generation Settings
            </h3>
            <p style={styles.subheader}>
                맞춤형 카피 생성을 위한 타겟 설정을 구성해주세요. 선택한 옵션에 따라 각 국가/페르소나별 최적화된 카피가 생성됩니다.
            </p>

            {/* Countries */}
            <div style={styles.sectionTitleFirst}>
                <Globe size={14} />Target Countries
                <button style={styles.selectAll} onClick={toggleAllCountries}>
                    {selectedCountries.length === COUNTRIES.length ? 'Deselect All' : 'Select All'}
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
                <Users size={14} />Target Age Groups
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

            {/* Personas */}
            <div style={styles.sectionTitle}>
                <UserCheck size={14} />Personas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PERSONAS.map(p => (
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

            {/* Submit */}
            <div style={styles.submitRow}>
                <div style={styles.copyCountGroup}>
                    <span style={styles.copyCountLabel}>생성 개수</span>
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
                            Generating...
                        </>
                    ) : (
                        <>
                            <ArrowRight size={18} />
                            Generate Copy
                        </>
                    )}
                </button>
            </div>
            {!canSubmit && (
                <p style={{ fontSize: '0.78rem', color: '#B45309', textAlign: 'center', marginTop: '8px' }}>
                    국가, 연령대, 페르소나를 각각 1개 이상 선택해주세요.
                </p>
            )}
        </div>
    );
};

export default GenerationConfig;
