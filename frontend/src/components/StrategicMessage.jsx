import React, { useState, useEffect } from 'react';
import { MessageSquareText, Target, Lightbulb, Quote, Loader, SmilePlus, Pencil, Check, X } from 'lucide-react';
import { COLORS } from '../styles/theme';
import { useT } from '../shared/i18n/useTranslation';

const StrategicMessage = ({ strategicData, isLoading, isApproved, onModify, onApprove, onUpdate, readOnly = false }) => {
    const t = useT();
    const [editingCard, setEditingCard] = useState(null);
    const [editData, setEditData] = useState({});
    const [localData, setLocalData] = useState(null);

    useEffect(() => {
        if (strategicData) setLocalData({ ...strategicData });
    }, [strategicData]);

    const startEdit = (cardId, initialValue) => {
        setEditingCard(cardId);
        setEditData(typeof initialValue === 'object' ? JSON.parse(JSON.stringify(initialValue)) : initialValue);
    };

    const cancelEdit = () => {
        setEditingCard(null);
        setEditData({});
    };

    const saveEdit = (cardId) => {
        const updated = { ...localData };
        if (cardId === 'coreMessage') updated.coreMessage = editData;
        else if (cardId === 'messagePillars') updated.messagePillars = editData;
        else if (cardId === 'toneDirection') updated.toneDirection = editData;
        else if (cardId === 'emotionalHook') updated.emotionalHook = editData;
        else if (cardId === 'keyPhrases') updated.keyPhrases = editData;
        setLocalData(updated);
        if (onUpdate) onUpdate(updated);
        setEditingCard(null);
        setEditData({});
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
            fontSize: '1.1rem',
            fontWeight: 800,
            color: COLORS.TEXT_MAIN,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
        },
        gridContainer: {
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '1.5rem',
        },
        card: {
            backgroundColor: COLORS.WHITE,
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: `1px solid ${COLORS.BORDER}`,
            display: 'flex',
            flexDirection: 'column',
        },
        cardHeader: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
        },
        cardTitle: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: COLORS.TEXT_SUB,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: 0,
        },
        editBtn: {
            width: '30px', height: '30px', borderRadius: '8px', border: `1px solid ${COLORS.BORDER}`,
            backgroundColor: COLORS.WHITE, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease',
        },
        editActions: {
            display: 'flex', gap: '6px',
        },
        saveBtn: {
            width: '30px', height: '30px', borderRadius: '8px', border: 'none',
            backgroundColor: COLORS.LG_RED, color: COLORS.WHITE, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        },
        cancelBtn: {
            width: '30px', height: '30px', borderRadius: '8px', border: `1px solid ${COLORS.BORDER}`,
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
        bodyText: {
            margin: 0, fontSize: '0.9rem', color: COLORS.TEXT_SUB, lineHeight: 1.6,
        },
        blockquote: {
            margin: 0, padding: '12px 16px', borderLeft: `3px solid ${COLORS.LG_RED}`,
            backgroundColor: '#FFF8FA', borderRadius: '0 10px 10px 0',
            fontSize: '0.95rem', fontStyle: 'italic', lineHeight: 1.7, color: COLORS.TEXT_MAIN,
        },
        tag: {
            display: 'inline-block', padding: '5px 12px', borderRadius: '10px',
            fontSize: '0.82rem', fontWeight: 600, margin: '0 6px 6px 0',
            backgroundColor: '#FFF0F3', color: COLORS.LG_RED,
        },
        loadingContainer: {
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '3rem', gap: '1rem',
        },
        primaryBtn: {
            padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '1rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)', transition: 'transform 0.2s ease',
        },
    };

    const CardHeader = ({ icon, title, cardId, editValue }) => (
        <div style={styles.cardHeader}>
            <h4 style={styles.cardTitle}>{icon} {title}</h4>
            {!readOnly && (editingCard === cardId ? (
                <div style={styles.editActions}>
                    <button style={styles.cancelBtn} onClick={cancelEdit} title={t('common.cancel')}>
                        <X size={14} />
                    </button>
                    <button style={styles.saveBtn} onClick={() => saveEdit(cardId)} title={t('common.save')}>
                        <Check size={14} />
                    </button>
                </div>
            ) : (
                <button
                    style={styles.editBtn}
                    onClick={() => startEdit(cardId, editValue)}
                    title={t('common.edit')}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.LG_RED; e.currentTarget.style.color = COLORS.LG_RED; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.BORDER; e.currentTarget.style.color = COLORS.TEXT_SUB; }}
                >
                    <Pencil size={13} />
                </button>
            ))}
        </div>
    );

    if (isLoading) {
        return (
            <div style={styles.container}>
                <h3 style={styles.header}>
                    <MessageSquareText size={22} color={COLORS.LG_RED} />Strategic Message
                </h3>
                <div style={styles.loadingContainer}>
                    <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: COLORS.LG_RED }} />
                    <p style={{ ...styles.bodyText, textAlign: 'center' }}>
                        {t('strategic.loading')}
                    </p>
                </div>
            </div>
        );
    }

    if (!localData) return null;

    const { coreMessage, messagePillars, emotionalHook, toneDirection, keyPhrases } = localData;

    return (
        <div style={styles.container}>
            <h3 style={styles.header}>
                <MessageSquareText size={22} color={COLORS.LG_RED} />Strategic Message
            </h3>
            <div style={styles.gridContainer}>

                {/* 1. Core Strategic Message */}
                {coreMessage && (
                    <div style={{ ...styles.card, gridColumn: 'span 12' }}>
                        <CardHeader icon={<Target size={14} />} title="Core Strategic Message" cardId="coreMessage" editValue={coreMessage} />
                        {editingCard === 'coreMessage' ? (
                            <textarea
                                style={{ ...styles.textarea, minHeight: '80px' }}
                                value={editData}
                                onChange={e => setEditData(e.target.value)}
                            />
                        ) : (
                            <div style={styles.blockquote}>"{coreMessage}"</div>
                        )}
                    </div>
                )}

                {/* 2. Message Pillars */}
                {messagePillars && messagePillars.length > 0 && (
                    <div style={{ ...styles.card, gridColumn: 'span 7' }}>
                        <CardHeader icon={<Lightbulb size={14} />} title="Message Pillars" cardId="messagePillars" editValue={messagePillars} />
                        {editingCard === 'messagePillars' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {editData.map((pillar, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                        <span style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            backgroundColor: '#FFF0F3', color: COLORS.LG_RED,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginTop: '6px',
                                        }}>{i + 1}</span>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <input
                                                style={styles.input}
                                                value={pillar.title}
                                                onChange={e => {
                                                    const updated = [...editData];
                                                    updated[i] = { ...updated[i], title: e.target.value };
                                                    setEditData(updated);
                                                }}
                                                placeholder="Pillar title"
                                            />
                                            <textarea
                                                style={{ ...styles.textarea, minHeight: '50px' }}
                                                value={pillar.description}
                                                onChange={e => {
                                                    const updated = [...editData];
                                                    updated[i] = { ...updated[i], description: e.target.value };
                                                    setEditData(updated);
                                                }}
                                                placeholder="Description"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {messagePillars.map((pillar, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                        <span style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            backgroundColor: '#FFF0F3', color: COLORS.LG_RED,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                                        }}>{i + 1}</span>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: COLORS.TEXT_MAIN }}>
                                                {pillar.title}
                                            </p>
                                            <p style={{ ...styles.bodyText, marginTop: '4px' }}>{pillar.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Tone Direction */}
                {toneDirection && (
                    <div style={{ ...styles.card, gridColumn: 'span 5' }}>
                        <CardHeader icon={<Quote size={14} />} title="Tone & Direction" cardId="toneDirection" editValue={toneDirection} />
                        {editingCard === 'toneDirection' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: COLORS.TEXT_MAIN, marginBottom: '4px', display: 'block' }}>Primary Tone</label>
                                    <input style={styles.input} value={editData.primary || ''} onChange={e => setEditData({ ...editData, primary: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: COLORS.TEXT_MAIN, marginBottom: '4px', display: 'block' }}>Avoid</label>
                                    <input style={styles.input} value={editData.avoid || ''} onChange={e => setEditData({ ...editData, avoid: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: COLORS.TEXT_MAIN, marginBottom: '4px', display: 'block' }}>Voice Character</label>
                                    <input style={styles.input} value={editData.voiceCharacter || ''} onChange={e => setEditData({ ...editData, voiceCharacter: e.target.value })} />
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {toneDirection.primary && (
                                    <p style={styles.bodyText}><strong>Primary Tone:</strong> {toneDirection.primary}</p>
                                )}
                                {toneDirection.avoid && (
                                    <p style={styles.bodyText}><strong>Avoid:</strong> {toneDirection.avoid}</p>
                                )}
                                {toneDirection.voiceCharacter && (
                                    <p style={styles.bodyText}><strong>Voice Character:</strong> {toneDirection.voiceCharacter}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 4. Emotional Hook */}
                {emotionalHook && (
                    <div style={{ ...styles.card, gridColumn: 'span 12' }}>
                        <CardHeader icon={<Quote size={14} />} title="Emotional Hook" cardId="emotionalHook" editValue={emotionalHook} />
                        {editingCard === 'emotionalHook' ? (
                            <textarea
                                style={{ ...styles.textarea, minHeight: '60px' }}
                                value={editData}
                                onChange={e => setEditData(e.target.value)}
                            />
                        ) : (
                            <p style={styles.bodyText}>{emotionalHook}</p>
                        )}
                    </div>
                )}

                {/* 5. Key Phrases */}
                {keyPhrases && keyPhrases.length > 0 && (
                    <div style={{ ...styles.card, gridColumn: 'span 12' }}>
                        <CardHeader icon={<MessageSquareText size={14} />} title="Key Phrases" cardId="keyPhrases" editValue={keyPhrases} />
                        {editingCard === 'keyPhrases' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {editData.map((phrase, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <input
                                            style={{ ...styles.input, flex: 1 }}
                                            value={phrase}
                                            onChange={e => {
                                                const updated = [...editData];
                                                updated[i] = e.target.value;
                                                setEditData(updated);
                                            }}
                                        />
                                        <button
                                            style={{ ...styles.cancelBtn, width: '26px', height: '26px', flexShrink: 0 }}
                                            onClick={() => setEditData(editData.filter((_, j) => j !== i))}
                                            title={t('common.delete')}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    style={{
                                        padding: '6px 12px', borderRadius: '8px', border: `1px dashed ${COLORS.BORDER}`,
                                        backgroundColor: 'transparent', color: COLORS.TEXT_SUB, fontSize: '0.82rem',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                    }}
                                    onClick={() => setEditData([...editData, ''])}
                                >
                                    + Add phrase
                                </button>
                            </div>
                        ) : (
                            <div>
                                {keyPhrases.map((phrase, i) => (
                                    <span key={i} style={styles.tag}>{phrase}</span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* HITL Action */}
                {!isApproved && (
                    <div style={{...styles.card, gridColumn: 'span 12', backgroundColor: '#FFFBEA', border: '1px solid #FFD6A5', textAlign: 'center'}}>
                        <h4 style={{ ...styles.cardTitle, justifyContent: 'center', marginBottom: '1rem' }}><SmilePlus size={14} />Does this strategic message align with your vision?</h4>
                        <p style={{margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: '#B45309'}}>Approve to proceed to Copy Generation, or modify the strategic message.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button style={{ ...styles.primaryBtn, flex: 1, backgroundColor: COLORS.WHITE, color: COLORS.LG_RED, border: `1px solid ${COLORS.LG_RED}` }} onClick={onModify}>Modify Strategic Message</button>
                            <button style={{ ...styles.primaryBtn, flex: 1, backgroundColor: COLORS.LG_RED, color: COLORS.WHITE }} onClick={onApprove}>Generate Copy</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StrategicMessage;
