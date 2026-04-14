import { useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'

import { apiClient, readSSE } from '@/shared/api/client'
import type {
  CorrectionRequest,
  CorrectionResponse,
  ReviewHistoryResponse,
  ReviewRequest,
  ReviewResult,
  ReviewSessionResponse,
} from '@/shared/api/types'

export function useReviewHistory() {
  return useQuery({
    queryKey: ['review', 'history'],
    queryFn: () =>
      apiClient.get<ReviewHistoryResponse>('/api/v1/campaigns/review/history'),
  })
}

export function useReviewSession(sessionId: string | null) {
  return useQuery({
    queryKey: ['review', 'session', sessionId],
    queryFn: () =>
      apiClient.get<ReviewSessionResponse>(
        `/api/v1/campaigns/review/${sessionId}`,
      ),
    enabled: !!sessionId,
  })
}

/**
 * SSE 기반 리뷰 실행 훅.
 * /api/v1/campaigns/review 는 StreamingResponse(SSE)를 반환하므로
 * readSSE를 사용해 스킬별 진행 → 최종 결과를 단계적으로 수신한다.
 */
export function useRunReviewSSE() {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progressMessages, setProgressMessages] = useState<string[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const run = useCallback(
    async (body: ReviewRequest): Promise<ReviewResult[]> => {
      setIsPending(true)
      setIsError(false)
      setError(null)
      setProgressMessages([])

      abortRef.current = new AbortController()
      const results: ReviewResult[] = []

      try {
        await readSSE(
          '/api/v1/campaigns/review',
          body,
          (event) => {
            const type = event.type as string
            if (type === 'review_started') {
              const skills = event.skills as string[] | undefined
              setProgressMessages((prev) => [
                ...prev,
                `리뷰 세션 시작 — ${skills?.length ?? 0}개 스킬`,
              ])
            } else if (type === 'skill_completed') {
              results.push({
                type: 'skill_completed',
                skillId: event.skillId as string,
                skillType: event.skillType as string,
                targetCopyKey: event.targetCopyKey as string,
                score: event.score as number,
                passed: event.passed as boolean,
                strengths: (event.strengths as string[]) ?? [],
                weaknesses: (event.weaknesses as string[]) ?? [],
                improvements: (event.improvements as string[]) ?? [],
                executionMs: event.executionMs as number | undefined,
              })
              setProgressMessages((prev) => [
                ...prev,
                `✓ ${event.skillId} → ${event.targetCopyKey} : ${event.passed ? 'PASS' : 'FAIL'} (${event.score})`,
              ])
            } else if (type === 'review_done') {
              setProgressMessages((prev) => [...prev, '리뷰 완료'])
            } else if (type === 'error') {
              throw new Error(
                (event.message as string) || 'Review failed',
              )
            }
          },
          abortRef.current.signal,
        )

        setIsPending(false)
        return results
      } catch (err) {
        const msg =
          err instanceof DOMException && err.name === 'AbortError'
            ? '리뷰가 취소되었습니다.'
            : (err as Error).message
        setIsError(true)
        setError(msg)
        setIsPending(false)
        return results // 부분 결과라도 반환
      }
    },
    [],
  )

  return { run, isPending, isError, error, progressMessages, cancel }
}

export function useCorrectCopy() {
  return useMutation({
    mutationFn: (body: CorrectionRequest) =>
      apiClient.post<CorrectionResponse>('/api/v1/campaigns/correct', body),
  })
}
