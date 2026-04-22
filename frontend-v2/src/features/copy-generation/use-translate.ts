import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { apiClient } from '@/shared/api/client'
import type { CopyItem } from '@/shared/api/types'

export interface TranslatedCopy {
  headline: string
  subheadline: string
  bodyCopy: string
  cta: string
}

/** 로케일 코드 → LLM 프롬프트에 전달할 자연어 언어 이름. */
const LOCALE_NAME: Record<string, string> = {
  ko: 'Korean (한국어)',
  en: 'English',
  de: 'German (Deutsch)',
  fr: 'French (Français)',
  es: 'Spanish (Español)',
  'zh-CN': 'Simplified Chinese (简体中文)',
  zh: 'Simplified Chinese (简体中文)',
  ar: 'Arabic (العربية)',
  th: 'Thai (ไทย)',
}

function resolveLanguageName(lng: string): string {
  if (LOCALE_NAME[lng]) return LOCALE_NAME[lng]
  const base = lng.split('-')[0]
  return LOCALE_NAME[base] ?? LOCALE_NAME.en
}

/**
 * 비-UI언어 카피를 현재 UI 로케일로 번역하는 훅.
 * - /api/v1/campaigns/chat 엔드포인트를 활용
 * - 결과를 `${copyKey}::${locale}` 기반으로 캐시 (언어 전환 시 재번역)
 * - 카피 언어와 UI 언어가 동일할 것으로 추정되면 번역 생략 (countryCode로 판정)
 */
export function useTranslateCopy() {
  const { i18n } = useTranslation()
  const currentLocale = i18n.language || 'ko'

  const [translations, setTranslations] = useState<
    Map<string, TranslatedCopy>
  >(new Map())
  const [pending, setPending] = useState<Set<string>>(new Set())
  const requestedRef = useRef<Set<string>>(new Set())

  const translate = useCallback(
    async (copyKey: string, copy: CopyItem) => {
      // 언어가 바뀐 경우 재요청될 수 있도록 로케일을 키에 포함
      const requestKey = `${copyKey}::${currentLocale}`
      if (requestedRef.current.has(requestKey)) return
      requestedRef.current.add(requestKey)

      setPending((prev) => new Set(prev).add(copyKey))

      const text = [
        copy.headline && `Headline: ${copy.headline}`,
        copy.subheadline && `Subheadline: ${copy.subheadline}`,
        copy.bodyCopy && `Body Copy: ${copy.bodyCopy}`,
        copy.cta && `CTA: ${copy.cta}`,
      ]
        .filter(Boolean)
        .join('\n')

      const targetLanguage = resolveLanguageName(currentLocale)

      try {
        const res = await apiClient.post<{ reply: string }>(
          '/api/v1/campaigns/chat',
          {
            messages: [
              {
                role: 'user',
                content:
                  `Translate the following marketing copy into **${targetLanguage}**. ` +
                  `Preserve meaning and nuance naturally. Keep each field label ` +
                  `(Headline, Subheadline, Body Copy, CTA) in the same format. ` +
                  `Keep brand assets (LG, ThinQ, Life's Good, OLED, gram) untranslated. ` +
                  `Respond with ONLY the translated lines, no explanation.\n\n${text}`,
              },
            ],
            locale: currentLocale,
          },
        )

        const reply = res.reply || ''
        const parsed = parseTranslation(reply, copy)

        setTranslations((prev) => new Map(prev).set(copyKey, parsed))
      } catch (err) {
        console.error('[useTranslateCopy] failed', err)
        requestedRef.current.delete(requestKey)
      } finally {
        setPending((prev) => {
          const next = new Set(prev)
          next.delete(copyKey)
          return next
        })
      }
    },
    [currentLocale],
  )

  return { translations, pending, translate }
}

/** LLM 응답에서 필드별 번역을 추출 */
function parseTranslation(reply: string, _original: CopyItem): TranslatedCopy {
  const get = (label: string): string => {
    const regex = new RegExp(`${label}\\s*[:：]\\s*(.+)`, 'i')
    const match = reply.match(regex)
    return match?.[1]?.trim() || ''
  }

  return {
    headline: get('Headline') || reply.split('\n')[0] || '',
    subheadline: get('Subheadline') || '',
    bodyCopy: get('Body Copy') || get('Body') || '',
    cta: get('CTA') || '',
  }
}
