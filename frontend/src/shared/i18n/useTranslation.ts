import { useCallback } from 'react'
import { useUIStore } from '@/shared/state/ui-store'
import translations from './locales'
import type { Locale } from './locales'

/**
 * i18n translation hook
 *
 * Usage:
 *   const t = useT()
 *   t('nav.home')            → "홈" (if locale is ko)
 *   t('gen.generateWithWriters', { n: 3 }) → "3명의 Writer로 생성"
 */
export function useT() {
  const locale = useUIStore((s) => s.locale)

  return useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const entry = translations[key]
      if (!entry) return key
      let text = entry[locale] || entry['en'] || key
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v))
        }
      }
      return text
    },
    [locale],
  )
}

/** Non-hook version for use outside React components */
export function translate(key: string, locale: Locale, params?: Record<string, string | number>): string {
  const entry = translations[key]
  if (!entry) return key
  let text = entry[locale] || entry['en'] || key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v))
    }
  }
  return text
}
