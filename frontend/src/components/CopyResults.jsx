import React, { useState, useEffect } from 'react';
import { Globe, FileText, Lightbulb, BookOpen, ChevronDown, ChevronRight, Loader, Pencil, Check, X, ArrowRight } from 'lucide-react';
import { COLORS } from '../styles/theme';
import { useT } from '../shared/i18n/useTranslation';

const COUNTRY_META = {
    US: { label: 'USA', flag: '🇺🇸', lang: 'English' },
    DE: { label: 'Germany', flag: '🇩🇪', lang: 'Deutsch' },
    GB: { label: 'UK', flag: '🇬🇧', lang: 'English (UK)' },
    FR: { label: 'France', flag: '🇫🇷', lang: 'Français' },
    IT: { label: 'Italy', flag: '🇮🇹', lang: 'Italiano' },
    ES: { label: 'Spain', flag: '🇪🇸', lang: 'Español' },
    IN: { label: 'India', flag: '🇮🇳', lang: 'English / Hindi' },
    BR: { label: 'Brazil', flag: '🇧🇷', lang: 'Português' },
    KR: { label: 'Korea', flag: '🇰🇷', lang: '한국어' },
    AU: { label: 'Australia', flag: '🇦🇺', lang: 'English (AU)' },
    ID: { label: 'Indonesia', flag: '🇮🇩', lang: 'Bahasa Indonesia' },
    SA: { label: 'Saudi Arabia', flag: '🇸🇦', lang: 'العربية' },
    JP: { label: 'Japan', flag: '🇯🇵', lang: '日本語' },
    CN: { label: 'China', flag: '🇨🇳', lang: '中文' },
    NL: { label: 'Netherlands', flag: '🇳🇱', lang: 'Nederlands' },
    PL: { label: 'Poland', flag: '🇵🇱', lang: 'Polski' },
    SE: { label: 'Sweden', flag: '🇸🇪', lang: 'Svenska' },
    TH: { label: 'Thailand', flag: '🇹🇭', lang: 'ไทย' },
    CA: { label: 'Canada', flag: '🇨🇦', lang: 'English / Français' },
    MX: { label: 'Mexico', flag: '🇲🇽', lang: 'Español' },
    AR: { label: 'Argentina', flag: '🇦🇷', lang: 'Español' },
    AE: { label: 'UAE', flag: '🇦🇪', lang: 'العربية' },
    ZA: { label: 'South Africa', flag: '🇿🇦', lang: 'English' },
};

const CopyResults = ({ results, isGenerating, onUpdate, onReview, readOnly = false }) => {
    const t = useT();
    const [expandedCountries, setExpandedCountries] = useState(new Set());
    const [activeCopyIndex, setActiveCopyIndex] = useState({});
    const [localResults, setLocalResults] = useState(null);
    const [editingField, setEditingField] = useState(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        if (results) setLocalResults(JSON.parse(JSON.stringify(results)));
    }, [results]);

    const startEdit = (fieldKey, value) => {
        setEditingField(fieldKey);
        setEditValue(value || '');
    };

    const cancelEdit = () => {
        setEditingField(null);
        setEditValue('');
    };

    const saveEdit = (countryCode, copyIdx, field) => {
        const updated = JSON.parse(JSON.stringify(localResults));
        const countryEntry = updated.find(r => r.countryCode === countryCode);
        if (!countryEntry) return;
        const copies = countryEntry.copies || [countryEntry];
        copies[copyIdx][field] = editValue;
        if (!countryEntry.copies) {
            Object.assign(countryEntry, copies[0]);
        }
        setLocalResults(updated);
        if (onUpdate) onUpdate(updated);
        setEditingField(null);
        setEditValue('');
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
            marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px',
        },
        loadingContainer: {
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '3rem', gap: '1rem',
        },
        countryCard: {
            backgroundColor: COLORS.WHITE,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: `1px solid ${COLORS.BORDER}`,
            marginBottom: '1rem',
            overflow: 'hidden',
        },
        countryHeader: (isOpen) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '1rem 1.25rem', cursor: 'pointer', userSelect: 'none',
            backgroundColor: isOpen ? '#FAFAFA' : COLORS.WHITE,
            transition: 'background-color 0.15s ease',
        }),
        flag: {
            fontSize: '1.5rem',
        },
        countryName: {
            fontWeight: 700, fontSize: '0.95rem', color: COLORS.TEXT_MAIN,
        },
        langBadge: {
            fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
            backgroundColor: '#FFF0F3', color: COLORS.LG_RED,
        },
        countryBody: {
            padding: '0 1.25rem 1.25rem',
            borderTop: `1px solid ${COLORS.BORDER}`,
        },
        tabBar: {
            display: 'flex', gap: '4px', padding: '12px 0 8px',
            borderBottom: `1px solid ${COLORS.BORDER}`, marginBottom: '4px',
        },
        tab: (active) => ({
            padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit',
            backgroundColor: active ? COLORS.LG_RED : 'transparent',
            color: active ? COLORS.WHITE : COLORS.TEXT_SUB,
            transition: 'all 0.15s ease',
        }),
        copySection: {
            marginTop: '1rem',
        },
        fieldHeader: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '6px',
        },
        label: {
            fontSize: '0.75rem', fontWeight: 700, color: COLORS.TEXT_SUB,
            textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0,
        },
        headline: {
            fontSize: '1.2rem', fontWeight: 800, color: COLORS.TEXT_MAIN,
            lineHeight: 1.4, margin: 0,
        },
        subheadline: {
            fontSize: '0.95rem', fontWeight: 600, color: COLORS.LG_RED,
            lineHeight: 1.5, margin: 0,
        },
        bodyCopy: {
            fontSize: '0.9rem', color: COLORS.TEXT_MAIN, lineHeight: 1.7,
            margin: 0, whiteSpace: 'pre-wrap',
        },
        cta: {
            display: 'inline-block', padding: '8px 20px', borderRadius: '8px',
            backgroundColor: COLORS.LG_RED, color: COLORS.WHITE,
            fontWeight: 700, fontSize: '0.88rem',
        },
        divider: {
            borderTop: `1px solid ${COLORS.BORDER}`, margin: '1rem 0',
        },
        insightBox: (bg) => ({
            padding: '12px 16px', borderRadius: '12px', backgroundColor: bg,
            fontSize: '0.85rem', lineHeight: 1.6, color: COLORS.TEXT_MAIN,
            marginTop: '6px',
        }),
        insightLabel: {
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '0.78rem', fontWeight: 700, color: COLORS.TEXT_SUB,
            textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0,
        },
        editBtn: {
            width: '26px', height: '26px', borderRadius: '6px', border: `1px solid ${COLORS.BORDER}`,
            backgroundColor: COLORS.WHITE, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: COLORS.TEXT_SUB,
            transition: 'all 0.15s ease', flexShrink: 0,
        },
        editActions: {
            display: 'flex', gap: '4px',
        },
        saveBtn: {
            width: '26px', height: '26px', borderRadius: '6px', border: 'none',
            backgroundColor: COLORS.LG_RED, color: COLORS.WHITE, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        },
        cancelBtn: {
            width: '26px', height: '26px', borderRadius: '6px', border: `1px solid ${COLORS.BORDER}`,
            backgroundColor: COLORS.WHITE, color: COLORS.TEXT_SUB, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        },
        textarea: {
            width: '100%', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${COLORS.BORDER}`,
            fontSize: '0.9rem', lineHeight: 1.6, color: COLORS.TEXT_MAIN, fontFamily: 'inherit',
            resize: 'vertical', outline: 'none', boxSizing: 'border-box', backgroundColor: COLORS.BG_GRAY,
        },
        input: {
            width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${COLORS.BORDER}`,
            fontSize: '0.9rem', color: COLORS.TEXT_MAIN, fontFamily: 'inherit',
            outline: 'none', boxSizing: 'border-box', backgroundColor: COLORS.BG_GRAY,
        },
        reviewBtn: {
            width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
            fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            backgroundColor: COLORS.LG_RED, color: COLORS.WHITE, marginTop: '1.5rem',
            boxShadow: '0 8px 20px rgba(165, 0, 52, 0.25)',
            transition: 'all 0.2s ease',
        },
    };

    const EditableFieldHeader = ({ label, fieldKey, value, countryCode, copyIdx, field }) => {
        const isEditing = editingField === fieldKey;
        return (
            <div style={styles.fieldHeader}>
                <p style={styles.label}>{label}</p>
                {readOnly ? null : isEditing ? (
                    <div style={styles.editActions}>
                        <button style={styles.cancelBtn} onClick={cancelEdit} title={t('common.cancel')}>
                            <X size={12} />
                        </button>
                        <button style={styles.saveBtn} onClick={() => saveEdit(countryCode, copyIdx, field)} title={t('common.save')}>
                            <Check size={12} />
                        </button>
                    </div>
                ) : (
                    <button
                        style={styles.editBtn}
                        onClick={() => startEdit(fieldKey, value)}
                        title={t('common.edit')}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.LG_RED; e.currentTarget.style.color = COLORS.LG_RED; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.BORDER; e.currentTarget.style.color = COLORS.TEXT_SUB; }}
                    >
                        <Pencil size={11} />
                    </button>
                )}
            </div>
        );
    };

    if (isGenerating) {
        return (
            <div style={styles.container}>
                <h3 style={styles.header}>
                    <Globe size={22} color={COLORS.LG_RED} />Generated Copy
                </h3>
                <div style={styles.loadingContainer}>
                    <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: COLORS.LG_RED }} />
                    <p style={{ margin: 0, fontSize: '0.9rem', color: COLORS.TEXT_SUB, textAlign: 'center' }}>
                        {t('copy.generatingForCountries')}
                    </p>
                </div>
            </div>
        );
    }

    if (!localResults || localResults.length === 0) return null;

    const totalCopies = localResults.reduce((sum, r) => sum + (r.copies ? r.copies.length : 1), 0);

    return (
        <div style={styles.container}>
            <h3 style={styles.header}>
                <Globe size={22} color={COLORS.LG_RED} />Generated Copy
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: COLORS.TEXT_SUB, marginLeft: 'auto' }}>
                    {t('copy.countriesAndCopies', { countries: localResults.length, copies: totalCopies })}
                </span>
            </h3>

            {localResults.map((r) => {
                const meta = COUNTRY_META[r.countryCode] || { label: r.countryCode, flag: '🌐', lang: '' };
                const isOpen = expandedCountries.has(r.countryCode);
                const copies = r.copies || [r];
                const activeIdx = activeCopyIndex[r.countryCode] || 0;
                const activeCopy = copies[activeIdx] || copies[0];
                const keyPrefix = `${r.countryCode}-${activeIdx}`;

                return (
                    <div key={r.countryCode} style={styles.countryCard}>
                        <div
                            style={styles.countryHeader(isOpen)}
                            onClick={() => setExpandedCountries(prev => {
                                const next = new Set(prev);
                                if (next.has(r.countryCode)) next.delete(r.countryCode);
                                else next.add(r.countryCode);
                                return next;
                            })}
                        >
                            {isOpen ? <ChevronDown size={16} color={COLORS.TEXT_SUB} /> : <ChevronRight size={16} color={COLORS.TEXT_SUB} />}
                            <span style={styles.flag}>{meta.flag}</span>
                            <span style={styles.countryName}>{meta.label}</span>
                            <span style={styles.langBadge}>{meta.lang}</span>
                            <span style={{
                                fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                                backgroundColor: '#E8F5E9', color: '#2E7D32',
                            }}>
                                {copies.length}개
                            </span>
                            {!isOpen && activeCopy.headline && (
                                <span style={{
                                    marginLeft: 'auto', fontSize: '0.82rem', color: COLORS.TEXT_SUB,
                                    maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {activeCopy.headline}
                                </span>
                            )}
                        </div>

                        {isOpen && (
                            <div style={styles.countryBody}>
                                {/* Tab bar for multiple copies */}
                                {copies.length > 1 && (
                                    <div style={styles.tabBar}>
                                        {copies.map((_, idx) => (
                                            <button
                                                key={idx}
                                                style={styles.tab(idx === activeIdx)}
                                                onClick={() => {
                                                    cancelEdit();
                                                    setActiveCopyIndex(prev => ({ ...prev, [r.countryCode]: idx }));
                                                }}
                                            >
                                                Copy {idx + 1}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Headline */}
                                <div style={styles.copySection}>
                                    <EditableFieldHeader label="Headline" fieldKey={`${keyPrefix}-headline`} value={activeCopy.headline} countryCode={r.countryCode} copyIdx={activeIdx} field="headline" />
                                    {editingField === `${keyPrefix}-headline` ? (
                                        <input style={styles.input} value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus />
                                    ) : (
                                        <p style={styles.headline}>{activeCopy.headline}</p>
                                    )}
                                </div>

                                {/* Subheadline */}
                                <div style={styles.copySection}>
                                    <EditableFieldHeader label="Subheadline" fieldKey={`${keyPrefix}-subheadline`} value={activeCopy.subheadline} countryCode={r.countryCode} copyIdx={activeIdx} field="subheadline" />
                                    {editingField === `${keyPrefix}-subheadline` ? (
                                        <input style={styles.input} value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus />
                                    ) : activeCopy.subheadline ? (
                                        <p style={styles.subheadline}>{activeCopy.subheadline}</p>
                                    ) : (
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: COLORS.TEXT_SUB, fontStyle: 'italic' }}>-</p>
                                    )}
                                </div>

                                {/* Body Copy */}
                                <div style={styles.copySection}>
                                    <EditableFieldHeader label="Body Copy" fieldKey={`${keyPrefix}-bodyCopy`} value={activeCopy.bodyCopy} countryCode={r.countryCode} copyIdx={activeIdx} field="bodyCopy" />
                                    {editingField === `${keyPrefix}-bodyCopy` ? (
                                        <textarea style={{ ...styles.textarea, minHeight: '100px' }} value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus />
                                    ) : (
                                        <p style={styles.bodyCopy}>{activeCopy.bodyCopy}</p>
                                    )}
                                </div>

                                {/* CTA */}
                                <div style={styles.copySection}>
                                    <EditableFieldHeader label="Call to Action" fieldKey={`${keyPrefix}-cta`} value={activeCopy.cta} countryCode={r.countryCode} copyIdx={activeIdx} field="cta" />
                                    {editingField === `${keyPrefix}-cta` ? (
                                        <input style={styles.input} value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus />
                                    ) : activeCopy.cta ? (
                                        <span style={styles.cta}>{activeCopy.cta}</span>
                                    ) : (
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: COLORS.TEXT_SUB, fontStyle: 'italic' }}>-</p>
                                    )}
                                </div>

                                <div style={styles.divider} />

                                {/* Methodology */}
                                <div style={{ marginTop: '1rem' }}>
                                    <EditableFieldHeader label={<><Lightbulb size={13} /> Generation Methodology</>} fieldKey={`${keyPrefix}-methodology`} value={activeCopy.methodology} countryCode={r.countryCode} copyIdx={activeIdx} field="methodology" />
                                    {editingField === `${keyPrefix}-methodology` ? (
                                        <textarea style={{ ...styles.textarea, minHeight: '60px' }} value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus />
                                    ) : activeCopy.methodology ? (
                                        <div style={styles.insightBox('#F0F9FF')}>{activeCopy.methodology}</div>
                                    ) : null}
                                </div>

                                {/* Cultural Notes */}
                                <div style={{ marginTop: '1rem' }}>
                                    <EditableFieldHeader label={<><BookOpen size={13} /> Cultural Adaptation Notes</>} fieldKey={`${keyPrefix}-culturalNotes`} value={activeCopy.culturalNotes} countryCode={r.countryCode} copyIdx={activeIdx} field="culturalNotes" />
                                    {editingField === `${keyPrefix}-culturalNotes` ? (
                                        <textarea style={{ ...styles.textarea, minHeight: '60px' }} value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus />
                                    ) : activeCopy.culturalNotes ? (
                                        <div style={styles.insightBox('#FFF8FA')}>{activeCopy.culturalNotes}</div>
                                    ) : null}
                                </div>

                                {/* Tone Analysis */}
                                <div style={{ marginTop: '1rem' }}>
                                    <EditableFieldHeader label={<><FileText size={13} /> Tone Analysis</>} fieldKey={`${keyPrefix}-toneAnalysis`} value={activeCopy.toneAnalysis} countryCode={r.countryCode} copyIdx={activeIdx} field="toneAnalysis" />
                                    {editingField === `${keyPrefix}-toneAnalysis` ? (
                                        <textarea style={{ ...styles.textarea, minHeight: '60px' }} value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus />
                                    ) : activeCopy.toneAnalysis ? (
                                        <div style={styles.insightBox('#F0FFF4')}>{activeCopy.toneAnalysis}</div>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Review button */}
            {!readOnly && onReview && (
                <button style={styles.reviewBtn} onClick={onReview}>
                    <ArrowRight size={18} />
                    Review
                </button>
            )}
        </div>
    );
};

export default CopyResults;
