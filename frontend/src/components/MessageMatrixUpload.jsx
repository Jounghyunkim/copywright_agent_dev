import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, Check, Loader, AlertCircle } from 'lucide-react';
import { COLORS } from '../styles/theme';
import { useT } from '../shared/i18n/useTranslation';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

const MessageMatrixUpload = ({ onParsed, isDisabled = false, onActionNotify }) => {
    const t = useT();
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | loading-sheets | select | parsing | done | error
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const reset = () => {
    setFile(null);
    setSheets([]);
    setSelectedSheet('');
    setPhase('idle');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return;
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      setError(t('matrix.onlyXlsx'));
      setPhase('error');
      onActionNotify?.({ action: 'matrix-upload', status: 'failed', detail: t('matrix.onlyXlsx') });
      return;
    }

    setFile(selectedFile);
    setError('');
    setPhase('loading-sheets');
    onActionNotify?.({ action: 'matrix-upload', status: 'started', detail: `파일 업로드: ${selectedFile.name}` });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch(`${BASE}/api/v1/message-matrix/sheets`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      onActionNotify?.({ action: 'matrix-upload', status: 'completed', detail: `${data.sheets.length}개 시트 감지: ${data.sheets.join(', ')}` });

      if (data.sheets.length === 1) {
        setSheets(data.sheets);
        setSelectedSheet(data.sheets[0]);
        await parseSheets(selectedFile, [data.sheets[0]]);
      } else {
        setSheets(data.sheets);
        setSelectedSheet(data.sheets[0]);
        setPhase('select');
      }
    } catch (err) {
      setError(`시트 목록 로드 실패: ${err.message}`);
      setPhase('error');
      onActionNotify?.({ action: 'matrix-upload', status: 'failed', detail: `시트 목록 로드 실패: ${err.message}` });
    }
  }, [onActionNotify]);

  const parseSheets = async (targetFile, sheetNames) => {
    setPhase('parsing');
    onActionNotify?.({ action: 'matrix-parse', status: 'started', detail: `시트 파싱 중: ${sheetNames.join(', ')}` });
    try {
      const formData = new FormData();
      formData.append('file', targetFile);
      formData.append('sheets', sheetNames.join(','));
      const res = await fetch(`${BASE}/api/v1/message-matrix/parse`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPhase('done');
      const totalUsps = Object.values(data.results).reduce((sum, p) =>
        sum + (p.categories || []).reduce((s, c) => s + (c.usps || []).length, 0), 0
      );
      onActionNotify?.({ action: 'matrix-parse', status: 'completed', detail: `파싱 완료 — ${Object.keys(data.results).length}개 시트, ${totalUsps}개 USP 추출` });
      onParsed?.(data.results);
    } catch (err) {
      setError(`파싱 실패: ${err.message}`);
      setPhase('error');
      onActionNotify?.({ action: 'matrix-parse', status: 'failed', detail: `파싱 실패: ${err.message}` });
    }
  };

  const handleConfirmSheets = () => {
    if (!selectedSheet) return;
    parseSheets(file, [selectedSheet]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDisabled) return;
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [isDisabled, handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // ── Styles ──
  const dropZoneStyle = {
    border: `2px dashed ${phase === 'error' ? '#EF4444' : COLORS.BORDER}`,
    borderRadius: 10,
    padding: '20px',
    textAlign: 'center',
    cursor: isDisabled ? 'default' : 'pointer',
    background: phase === 'done' ? '#F0FDF4' : '#FAFAFA',
    transition: 'all 0.2s',
    opacity: isDisabled ? 0.5 : 1,
  };

  const btnStyle = {
    padding: '6px 16px',
    borderRadius: 6,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  };

  // ── idle: 드래그앤드롭 / 파일 선택 ──
  if (phase === 'idle' || phase === 'error') {
    return (
      <div>
        <div
          style={dropZoneStyle}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !isDisabled && inputRef.current?.click()}
        >
          <Upload size={28} color={COLORS.TEXT_SUB} style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, color: COLORS.TEXT_MAIN, fontWeight: 500 }}>
            {t('matrix.uploadInstructions')}
          </div>
          <div style={{ fontSize: 12, color: COLORS.TEXT_SUB, marginTop: 4 }}>
            {t('matrix.supportedFormat')}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            disabled={isDisabled}
          />
        </div>
        {phase === 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#EF4444', fontSize: 13 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>
    );
  }

  // ── loading-sheets ──
  if (phase === 'loading-sheets' || phase === 'parsing') {
    return (
      <div style={{ ...dropZoneStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} color={COLORS.LG_RED} />
        <span style={{ fontSize: 14, color: COLORS.TEXT_MAIN }}>
          {phase === 'loading-sheets' ? '시트 목록 로드 중...' : '파싱 중...'}
        </span>
      </div>
    );
  }

  // ── select: 시트 선택 ──
  if (phase === 'select') {
    return (
      <div style={{ border: `1px solid ${COLORS.BORDER}`, borderRadius: 10, padding: 16, background: '#FFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet size={18} color={COLORS.LG_RED} />
            <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.TEXT_MAIN }}>{file?.name}</span>
            <span style={{ fontSize: 12, color: COLORS.TEXT_SUB }}>({sheets.length}개 시트)</span>
          </div>
          <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={16} color={COLORS.TEXT_SUB} />
          </button>
        </div>

        <div style={{ fontSize: 13, color: COLORS.TEXT_SUB, marginBottom: 10 }}>
          {t('matrix.selectSheets')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {sheets.map((name, idx) => (
            <label key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 6,
              border: `1px solid ${selectedSheet === name ? COLORS.LG_RED : COLORS.BORDER}`,
              background: selectedSheet === name ? '#FFF5F7' : '#FFF',
              cursor: 'pointer', fontSize: 13, transition: 'all 0.15s',
            }}>
              <input
                type="radio"
                name="sheet-select"
                checked={selectedSheet === name}
                onChange={() => setSelectedSheet(name)}
                style={{ accentColor: COLORS.LG_RED }}
              />
              <span style={{ fontWeight: 500 }}>{idx + 1}.</span>
              <span>{name}</span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleConfirmSheets}
            disabled={!selectedSheet}
            style={{
              ...btnStyle,
              background: selectedSheet ? COLORS.LG_RED : '#CCC',
              color: '#FFF',
            }}
          >
            <Check size={14} /> {t('matrix.parseSheets')}
          </button>
          <button onClick={reset} style={{ ...btnStyle, background: '#F3F4F6', color: COLORS.TEXT_MAIN }}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    );
  }

  // ── done: 파일 업로드 완료 상태 ──
  if (phase === 'done') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 8, background: '#F0FDF4',
        border: '1px solid #BBF7D0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={16} color="#22C55E" />
          <FileSpreadsheet size={16} color={COLORS.TEXT_MAIN} />
          <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.TEXT_MAIN }}>{file?.name}</span>
          <span style={{ fontSize: 12, color: COLORS.TEXT_SUB }}>({selectedSheet} 파싱 완료)</span>
        </div>
        <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X size={16} color={COLORS.TEXT_SUB} />
        </button>
      </div>
    );
  }

  return null;
};

export default MessageMatrixUpload;
