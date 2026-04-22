import { CSSProperties, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import {
  useMessageMatrixParse,
  useMessageMatrixSheets,
} from '@/shared/api/hooks'
import type { MessageMatrixProduct } from '@/shared/api/types'

import { countMatrixStats } from './transform'

type Phase =
  | 'idle'
  | 'loading-sheets'
  | 'select'
  | 'parsing'
  | 'done'
  | 'error'

interface Props {
  /** 파싱 완료 시 부모에 시트별 ProductInfo 전달. */
  onParsed: (matrix: Record<string, MessageMatrixProduct>) => void
  /** 외부에서 disable 시키고자 할 때. */
  isDisabled?: boolean
}

/**
 * Message Matrix(.xlsx) 파일 업로드 컴포넌트.
 * 상태머신: idle → loading-sheets → (select | parsing) → done | error
 */
export function MessageMatrixUpload({ onParsed, isDisabled = false }: Props) {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [sheets, setSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string>('')
  const [parsedSummary, setParsedSummary] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const sheetsMutation = useMessageMatrixSheets()
  const parseMutation = useMessageMatrixParse()

  const reset = () => {
    setFile(null)
    setSheets([])
    setSelectedSheet('')
    setPhase('idle')
    setError('')
    setParsedSummary('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const parseSelected = async (target: File, sheet: string) => {
    setPhase('parsing')
    try {
      const res = await parseMutation.mutateAsync({
        file: target,
        sheets: [sheet],
      })
      const stats = countMatrixStats(res.results)
      setParsedSummary(
        t('matrix:summary', { sheetCount: stats.sheetCount, uspCount: stats.uspCount }),
      )
      setPhase('done')
      onParsed(res.results)
    } catch (err) {
      setError(t('matrix:error.parsingFailed', { message: (err as Error).message }))
      setPhase('error')
    }
  }

  const handleFileSelect = useCallback(
    async (selected: File | undefined) => {
      if (!selected) return
      const ext = selected.name.split('.').pop()?.toLowerCase()
      if (ext !== 'xlsx' && ext !== 'xls') {
        setError(t('matrix:error.format'))
        setPhase('error')
        return
      }
      setFile(selected)
      setError('')
      setPhase('loading-sheets')
      try {
        const res = await sheetsMutation.mutateAsync(selected)
        if (res.sheets.length === 0) {
          setError(t('matrix:error.empty'))
          setPhase('error')
          return
        }
        if (res.sheets.length === 1) {
          setSheets(res.sheets)
          setSelectedSheet(res.sheets[0])
          await parseSelected(selected, res.sheets[0])
        } else {
          setSheets(res.sheets)
          setSelectedSheet(res.sheets[0])
          setPhase('select')
        }
      } catch (err) {
        setError(t('matrix:error.sheetsLoadFailed', { message: (err as Error).message }))
        setPhase('error')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const handleConfirmSheets = () => {
    if (!file || !selectedSheet) return
    parseSelected(file, selectedSheet)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (isDisabled) return
      const dropped = e.dataTransfer.files?.[0]
      if (dropped) handleFileSelect(dropped)
    },
    [isDisabled, handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  /** 번들된 샘플 xlsx 를 fetch 하여 업로드 흐름에 주입. */
  const handleLoadSample = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isDisabled) return
      try {
        const res = await fetch('/samples/message-matrix-sample.xlsx')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        const sampleFile = new File(
          [blob],
          'SAMPLE_DUALCOOL_AI_Air_Message_Matrix.xlsx',
          { type: blob.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        )
        handleFileSelect(sampleFile)
      } catch (err) {
        console.error('[MessageMatrixUpload] sample load failed', err)
        setError(t('matrix:error.sampleLoadFailed'))
        setPhase('error')
      }
    },
    [isDisabled, handleFileSelect, t],
  )

  /* ── Render ── */

  if (phase === 'loading-sheets' || phase === 'parsing') {
    return (
      <div style={loadingZone}>
        <span style={spinner} />
        <span style={{ fontSize: 14, color: 'var(--neutral-900)' }}>
          {phase === 'loading-sheets' ? t('matrix:phase.loadingSheets') : t('matrix:phase.parsing')}
        </span>
        <style>{`@keyframes mm-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (phase === 'select') {
    return (
      <div style={selectCardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
            gap: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
            }}
          >
            <span style={{ color: 'var(--lg-red-600)', fontSize: 16 }}>▤</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--neutral-900)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {file?.name}
            </span>
            <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>
              {t('matrix:sheetList.count', { count: sheets.length })}
            </span>
          </div>
          <button type="button" onClick={reset} style={iconBtn} aria-label={t('matrix:button.cancel')}>
            ✕
          </button>
        </div>

        <p
          style={{
            fontSize: 12,
            color: 'var(--neutral-500)',
            marginBottom: 8,
          }}
        >
          {t('matrix:sheetList.selectPrompt')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sheets.map((name, idx) => (
            <label
              key={name}
              style={sheetRow(selectedSheet === name)}
            >
              <input
                type="radio"
                name="mm-sheet"
                checked={selectedSheet === name}
                onChange={() => setSelectedSheet(name)}
                style={{ accentColor: 'var(--lg-red-600)' }}
              />
              <span style={{ fontWeight: 600, color: 'var(--neutral-500)' }}>
                {idx + 1}.
              </span>
              <span>{name}</span>
            </label>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            justifyContent: 'flex-end',
            marginTop: 12,
          }}
        >
          <Button variant="ghost" className="btn-compact" onClick={reset}>
            {t('matrix:button.cancel')}
          </Button>
          <Button
            className="btn-compact"
            onClick={handleConfirmSheets}
            disabled={!selectedSheet}
          >
            {t('matrix:button.startParsing')}
          </Button>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div style={doneRowStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0,
          }}
        >
          <span style={{ color: 'var(--success)', fontSize: 14 }}>✓</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--neutral-900)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {file?.name}
          </span>
          <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>
            · {selectedSheet} · {parsedSummary}
          </span>
        </div>
        <button type="button" onClick={reset} style={iconBtn} aria-label={t('matrix:button.remove')}>
          ✕
        </button>
      </div>
    )
  }

  // idle / error
  return (
    <div>
      <div
        style={dropZoneStyle(isDisabled, phase === 'error')}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !isDisabled && inputRef.current?.click()}
      >
        <button
          type="button"
          onClick={handleLoadSample}
          disabled={isDisabled}
          style={sampleButtonStyle(isDisabled)}
          title={t('matrix:button.sampleTitle')}
        >
          ✦ {t('matrix:button.sample')}
        </button>
        <div
          style={{
            fontSize: 22,
            color: 'var(--neutral-500)',
            marginBottom: 6,
          }}
        >
          ⤒
        </div>
        <p
          style={{
            fontSize: 13,
            color: 'var(--neutral-900)',
            fontWeight: 500,
            margin: 0,
          }}
        >
          {t('matrix:dropzone.prompt')}
        </p>
        <p
          style={{
            fontSize: 12,
            color: 'var(--neutral-500)',
            marginTop: 4,
          }}
        >
          {t('matrix:dropzone.supportedFormats')}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e.target.files?.[0] ?? undefined)}
          disabled={isDisabled}
        />
      </div>
      {phase === 'error' && (
        <p
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            color: 'var(--danger)',
            fontSize: 13,
          }}
        >
          ⚠ {error}
        </p>
      )}
    </div>
  )
}

/* ── Styles ── */

const dropZoneStyle = (
  disabled: boolean,
  isError: boolean,
): CSSProperties => ({
  position: 'relative',
  border: `2px dashed ${isError ? 'var(--danger)' : 'var(--color-border)'}`,
  borderRadius: 10,
  padding: '20px',
  textAlign: 'center',
  cursor: disabled ? 'default' : 'pointer',
  background: 'var(--neutral-100)',
  transition: 'all 0.2s',
  opacity: disabled ? 0.5 : 1,
})

const sampleButtonStyle = (disabled: boolean): CSSProperties => ({
  position: 'absolute',
  top: 10,
  right: 10,
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--lg-red-700)',
  background: 'var(--white)',
  border: '1px solid var(--lg-red-600)',
  borderRadius: 999,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.5 : 1,
  transition: 'all 0.15s',
  zIndex: 1,
})

const loadingZone: CSSProperties = {
  border: '2px dashed var(--color-border)',
  borderRadius: 10,
  padding: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  background: 'var(--neutral-100)',
}

const spinner: CSSProperties = {
  width: 18,
  height: 18,
  border: '3px solid var(--neutral-200)',
  borderTopColor: 'var(--lg-red-600)',
  borderRadius: '50%',
  animation: 'mm-spin 0.8s linear infinite',
}

const selectCardStyle: CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  padding: 14,
  background: 'var(--white)',
}

const sheetRow = (selected: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderRadius: 8,
  border: `1.5px solid ${selected ? 'var(--lg-red-600)' : 'var(--color-border)'}`,
  background: selected ? 'var(--lg-red-100)' : 'var(--white)',
  cursor: 'pointer',
  fontSize: 13,
  transition: 'all 0.15s',
})

const doneRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  borderRadius: 10,
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  gap: 8,
}

const iconBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 4,
  fontSize: 14,
  color: 'var(--neutral-500)',
  lineHeight: 1,
}
