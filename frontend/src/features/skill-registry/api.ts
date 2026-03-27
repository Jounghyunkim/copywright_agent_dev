import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import type { Skill } from '@/shared/api/types'

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: () => apiClient.get<{ skills: Skill[] }>('/api/v1/skills'),
    select: (d) => d.skills,
  })
}

export function useSkillDetail(skillId: string | null) {
  return useQuery({
    queryKey: ['skills', skillId],
    queryFn: () => apiClient.get<Skill>(`/api/v1/skills/${skillId}`),
    enabled: !!skillId,
  })
}

export function useDeleteSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/skills/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  })
}
