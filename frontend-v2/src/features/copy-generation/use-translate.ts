import { useCallback, useRef, useState } from 'react'

import { apiClient } from '@/shared/api/client'
import type { CopyItem } from '@/shared/api/types'

export interface TranslatedCopy {
  headline: string
  subheadline: string
  bodyCopy: string
  cta: string
}

/**
 * 카피를 한국어로 번역하는 훅.
 * - /api/v1/campaigns/chat 엔드포인트를 활용
 * - 결과를 copyKey 기반으로 캐시
 * - KR 국가는 번역 생략
 */
export function useTranslateCopy() {
  const [translations, setTranslations] = useState<
    Map<string, TranslatedCopy>
  >(new Map())
  const [pending, setPending] = useState<Set<string>>(new Set())
  const requestedRef = useRef<Set<string>>(new Set())

  const translate = useCallback(
    async (copyKey: string, copy: CopyItem) => {
      // 이미 번역됨 또는 요청 중이면 스킵
      if (requestedRef.current.has(copyKey)) return
      requestedRef.current.add(copyKey)

      setPending((prev) => new Set(prev).add(copyKey))

      const text = [
        copy.headline && `Headline: ${copy.headline}`,
        copy.subheadline && `Subheadline: ${copy.subheadline}`,
        copy.bodyCopy && `Body Copy: ${copy.bodyCopy}`,
        copy.cta && `CTA: ${copy.cta}`,
      ]
        .filter(Boolean)
        .join('\n')

      try {
        const res = await apiClient.post<{ reply: string }>(
          '/api/v1/campaigns/chat',
          {
            messages: [
              {
                role: 'user',
                content: `다음 마케팅 카피를 한국어로 번역해 주세요. 의미와 뉘앙스를 살려 자연스럽게 번역하되, 각 필드(Headline, Subheadline, Body Copy, CTA)를 그대로 유지하여 동일한 형식으로 출력해 주세요. 설명 없이 번역 결과만 출력하세요.\n\n${text}`,
              },
            ],
          },
        )

        const reply = res.reply || ''
        const parsed = parseTranslation(reply, copy)

        setTranslations((prev) => new Map(prev).set(copyKey, parsed))
      } catch (err) {
        console.error('[useTranslateCopy] failed', err)
        requestedRef.current.delete(copyKey)
      } finally {
        setPending((prev) => {
          const next = new Set(prev)
          next.delete(copyKey)
          return next
        })
      }
    },
    [],
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
