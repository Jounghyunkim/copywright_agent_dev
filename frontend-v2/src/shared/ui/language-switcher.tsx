/**
 * 언어 전환 드롭다운 — 사이드바 푸터의 기어 메뉴 옆에 배치.
 * - 지구본 아이콘 + 현재 로케일 코드(대문자 뱃지)
 * - 클릭 시 지원 언어 목록 펼침
 * - 선택 시 i18n.changeLanguage + localStorage 저장 (i18next detector가 자동 처리)
 */
import { CSSProperties, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  LOCALE_META,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from '@/shared/i18n'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = resolveCurrent(i18n.language)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (lng: SupportedLocale) => {
    void i18n.changeLanguage(lng)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={LOCALE_META[current].nativeLabel}
        aria-label={`Language: ${LOCALE_META[current].nativeLabel}`}
        style={toggleButtonStyle}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="16"
          height="16"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a15 15 0 0 1 0 18" />
          <path d="M12 3a15 15 0 0 0 0 18" />
        </svg>
        <span style={codeBadgeStyle}>{current.toUpperCase().split('-')[0]}</span>
      </button>
      {open && (
        <div style={menuStyle}>
          {SUPPORTED_LOCALES.map((lng) => {
            const meta = LOCALE_META[lng]
            const active = current === lng
            return (
              <button
                key={lng}
                type="button"
                onClick={() => handleSelect(lng)}
                style={itemStyle(active)}
              >
                <span style={itemCodeStyle}>{lng.toUpperCase()}</span>
                <span style={itemLabelStyle}>{meta.nativeLabel}</span>
                {active && <span style={checkStyle}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** i18next가 `en-US` 같은 지역 변형을 반환할 수 있으니 지원 로케일 중 가장 유사한 것으로 매핑. */
function resolveCurrent(lng: string): SupportedLocale {
  if ((SUPPORTED_LOCALES as readonly string[]).includes(lng)) {
    return lng as SupportedLocale
  }
  const base = lng.split('-')[0]
  if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) {
    return base as SupportedLocale
  }
  return 'ko'
}

/* ── Styles ── */

const toggleButtonStyle: CSSProperties = {
  background: 'none',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 8,
  width: 56,
  height: 36,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  color: '#fff',
  padding: '0 6px',
}

const codeBadgeStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.5,
  fontFamily: 'JetBrains Mono, monospace',
}

const menuStyle: CSSProperties = {
  position: 'absolute',
  bottom: 44,
  left: 0,
  background: '#fff',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  minWidth: 180,
  overflow: 'hidden',
  zIndex: 100,
}

const itemStyle = (active: boolean): CSSProperties => ({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  gap: 10,
  padding: '8px 14px',
  background: active ? 'var(--neutral-100)' : 'none',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: 13,
  color: active ? 'var(--lg-red-700)' : 'var(--neutral-900)',
  fontWeight: active ? 700 : 500,
})

const itemCodeStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 0.5,
  background: 'var(--neutral-100)',
  color: 'var(--neutral-700)',
  padding: '2px 6px',
  borderRadius: 5,
  fontFamily: 'JetBrains Mono, monospace',
  minWidth: 40,
  textAlign: 'center',
}

const itemLabelStyle: CSSProperties = {
  flex: 1,
}

const checkStyle: CSSProperties = {
  color: 'var(--lg-red-600)',
  fontWeight: 800,
}
