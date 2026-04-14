import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  left: ReactNode
  right: ReactNode
  /** 좌측 패널 초기 비율 (0-1). 기본값 0.42. localStorage에 저장됨. */
  defaultRatio?: number
  /** 좌측 패널 최소 폭 (px). 기본 300. */
  minLeftPx?: number
  /** 우측 패널 최소 폭 (px). 기본 400. */
  minRightPx?: number
  /** localStorage key — 여러 SplitPane이 같은 페이지에 있을 때 구분. */
  storageKey?: string
}

/**
 * Horizontal 2-pane resizable container.
 * - 가운데 divider를 드래그하여 비율 조정
 * - 비율은 localStorage에 저장되어 새로고침해도 유지
 * - min/max 제약: 각 패널이 최소 폭 이하로 줄지 않음
 */
export function SplitPane({
  left,
  right,
  defaultRatio = 0.42,
  minLeftPx = 300,
  minRightPx = 400,
  storageKey = 'copylight-v2:split-pane',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ratio, setRatio] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const v = parseFloat(saved)
        if (!Number.isNaN(v) && v > 0 && v < 1) return v
      }
    } catch {
      // ignore
    }
    return defaultRatio
  })
  const draggingRef = useRef(false)

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, ratio.toString())
    } catch {
      // ignore
    }
  }, [ratio, storageKey])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const width = rect.width
      if (width <= 0) return
      const minLeftRatio = minLeftPx / width
      const maxLeftRatio = 1 - minRightPx / width
      const nextRatio = Math.min(maxLeftRatio, Math.max(minLeftRatio, x / width))
      setRatio(nextRatio)
    }
    const onUp = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [minLeftPx, minRightPx])

  return (
    <div
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: `${ratio * 100}% 6px 1fr`,
        minHeight: 0,
        height: '100%',
        width: '100%',
      }}
    >
      <div
        style={{
          minWidth: 0,
          minHeight: 0,
          overflow: 'auto',
          paddingRight: 4,
        }}
      >
        {left}
      </div>
      <div
        onMouseDown={onMouseDown}
        style={{
          cursor: 'col-resize',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
        role="separator"
        aria-orientation="vertical"
        title="드래그하여 너비 조정"
      >
        <span
          style={{
            width: 3,
            height: 40,
            background: 'var(--color-border)',
            borderRadius: 2,
          }}
        />
      </div>
      <div
        style={{
          minWidth: 0,
          minHeight: 0,
          overflow: 'auto',
          paddingLeft: 4,
        }}
      >
        {right}
      </div>
    </div>
  )
}
