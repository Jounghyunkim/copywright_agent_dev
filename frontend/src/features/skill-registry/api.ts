import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import type { Skill, AIPersona, CultureProfile } from '@/shared/api/types'

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: () => apiClient.get<{ skills: Skill[] }>('/api/v1/skills'),
    select: (d) => d.skills,
  })
}

export function useSkillCatalog() {
  return useQuery({
    queryKey: ['skills', 'catalog'],
    queryFn: () => apiClient.get<{ status: string; total: number; by_category: Record<string, Skill[]>; data: Skill[] }>('/api/v1/skills/catalog'),
  })
}

export function usePersonas() {
  return useQuery({
    queryKey: ['personas'],
    queryFn: () => apiClient.get<{ status: string; data: AIPersona[] }>('/api/v1/personas'),
    select: (d) => d.data,
  })
}

export function useCultureProfiles() {
  return useQuery({
    queryKey: ['culture-profiles'],
    queryFn: () => apiClient.get<{ status: string; data: CultureProfile[] }>('/api/v1/culture-profiles'),
    select: (d) => d.data,
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
