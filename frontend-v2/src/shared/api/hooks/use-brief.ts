import { useMutation } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'
import i18n from 'i18next'

import { apiClient, readSSE } from '@/shared/api/client'
import type {
  AnalysisReport,
  AnalyzeRequest,
  GenerateBriefRequest,
  GenerateBriefResponse,
} from '@/shared/api/types'

export function useGenerateBrief() {
  return useMutation({
    mutationFn: (body: GenerateBriefRequest) =>
      apiClient.post<GenerateBriefResponse>('/api/v1/campaigns/generate-brief', {
        ...body,
        locale: body.locale ?? i18n.language ?? 'ko',
      }),
  })
}

/**
 * SSE 기반 분석 훅.
 * /api/v1/campaigns/analyze 는 StreamingResponse(SSE)를 반환하므로
 * readSSE를 사용해 진행 메시지 → 최종 결과를 단계적으로 수신한다.
 *
 * 반환값:
 * - run(request) — SSE 스트림 시작. Promise<AnalysisReport> 반환.
 * - isPending — 실행 중 여부
 * - isError — 에러 발생 여부
 * - error — 에러 메시지
 * - progressMessages — 진행 상황 메시지 배열
 * - cancel() — 스트림 중단
 */
export function useAnalyzeSSE() {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progressMessages, setProgressMessages] = useState<string[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const run = useCallback(async (body: AnalyzeRequest): Promise<AnalysisReport | null> => {
    setIsPending(true)
    setIsError(false)
    setError(null)
    setProgressMessages([])

    abortRef.current = new AbortController()
    let result: AnalysisReport | null = null

    const bodyWithLocale: AnalyzeRequest = {
      ...body,
      locale: body.locale ?? i18n.language ?? 'ko',
    }

    try {
      await readSSE(
        '/api/v1/campaigns/analyze',
        bodyWithLocale,
        (event) => {
          const type = event.type as string
          if (type === 'progress') {
            const msg = event.message as string
            setProgressMessages((prev) => [...prev, msg])
          } else if (type === 'result') {
            if (event.status === 'success' && event.data) {
              result = event.data as AnalysisReport
            }
          } else if (type === 'error') {
            throw new Error((event.message as string) || 'Analysis failed')
          }
        },
        abortRef.current.signal,
      )

      if (!result) {
        throw new Error('서버가 분석 결과를 반환하지 않았습니다.')
      }

      setIsPending(false)
      return result
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'AbortError'
          ? '분석이 취소되었습니다.'
          : (err as Error).message
      setIsError(true)
      setError(msg)
      setIsPending(false)
      return null
    }
  }, [])

  return { run, isPending, isError, error, progressMessages, cancel }
}
