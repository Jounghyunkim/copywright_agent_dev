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
  /** 우측 패널을 접었다 폈다 할 수 있게 토글 버튼 노출. 기본 true. */
  collapsibleRight?: boolean
}

/** 접힌 상태의 우측 스트립 폭 */
const COLLAPSED_STRIP_PX = 40

/**
 * Horizontal 2-pane resizable container.
 * - 가운데 divider를 드래그하여 비율 조정
 * - 비율·접힘 상태는 localStorage에 저장
 * - 우측 패널은 우상단 토글 버튼으로 접었다 펼 수 있음 (collapsibleRight)
 */
export function SplitPane({
  left,
  right,
  defaultRatio = 0.42,
  minLeftPx = 300,
  minRightPx = 400,
  storageKey = 'copylight-v2:split-pane',
  collapsibleRight = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ratio, setRatio] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const v = parseFloat(saved)
        if (!Number.isNaN(v) && v > 0 && v < 1) return v
      }
    } catch {}
    return defaultRatio
  })
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`${storageKey}:right-collapsed`) === '1'
    } catch {
      return false
    }
  })
  const draggingRef = useRef(false)

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, ratio.toString())
    } catch {}
  }, [ratio, storageKey])

  useEffect(() => {
    try {
      localStorage.setItem(
        `${storageKey}:right-collapsed`,
        rightCollapsed ? '1' : '0',
      )
    } catch {}
  }, [rightCollapsed, storageKey])

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

  const gridTemplate = rightCollapsed
    ? `1fr 0px ${COLLAPSED_STRIP_PX}px`
    : `${ratio * 100}% 6px 1fr`

  return (
    <div
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: gridTemplate,
        minHeight: 0,
        height: '100%',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Left pane */}
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

      {/* Divider (접혀있을 땐 숨김) */}
      <div
        onMouseDown={rightCollapsed ? undefined : onMouseDown}
        style={{
          cursor: rightCollapsed ? 'default' : 'col-resize',
          background: 'transparent',
          display: rightCollapsed ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        role="separator"
        aria-orientation="vertical"
        title={rightCollapsed ? undefined : '드래그하여 너비 조정'}
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

      {/* Right pane */}
      <div
        style={{
          minWidth: 0,
          minHeight: 0,
          overflow: rightCollapsed ? 'hidden' : 'auto',
          paddingLeft: rightCollapsed ? 0 : 4,
          position: 'relative',
          height: '100%',
        }}
      >
        {rightCollapsed ? null : right}
      </div>

      {/* Floating toggle — 루트에 position: absolute, 항상 최상위에 표시 */}
      {collapsibleRight && (
        <button
          type="button"
          onClick={() => setRightCollapsed((v) => !v)}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 20,
            width: 30,
            height: 30,
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: '#fff',
            color: 'var(--neutral-700)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(17,17,17,0.10)',
          }}
          title={rightCollapsed ? 'AI 어시스턴트 펼치기' : 'AI 어시스턴트 접기'}
          aria-label={rightCollapsed ? 'AI 어시스턴트 펼치기' : 'AI 어시스턴트 접기'}
          aria-pressed={rightCollapsed}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="16"
            height="16"
          >
            {rightCollapsed ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
          </svg>
        </button>
      )}

      {/* 접힌 상태의 세로 스트립 — 루트 절대 위치, 토글 버튼 아래로 정렬 */}
      {rightCollapsed && (
        <div
          style={{
            position: 'absolute',
            top: 48,
            right: 4,
            width: `${COLLAPSED_STRIP_PX - 8}px`,
            bottom: 4,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--neutral-400)',
          }}
          aria-hidden
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            AI 어시스턴트
          </span>
        </div>
      )}
    </div>
  )
}

