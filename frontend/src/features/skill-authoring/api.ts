import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'

export function useGenerateSkillDraft() {
  return useMutation({
    mutationFn: (data: { name: string; purpose: string; goal: string; goodExample: string; badExample: string }) =>
      apiClient.post<{ draft: Record<string, unknown> }>('/api/v1/skills/generate-draft', data),
  })
}

export function useSaveSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post('/api/v1/skills', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  })
}
