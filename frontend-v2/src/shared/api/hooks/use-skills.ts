import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import type {
  CustomSkillCreate,
  CustomSkillUpdate,
  Skill,
  SkillDraftRequest,
  SkillDraftResponse,
  SkillListResponse,
} from '@/shared/api/types'

const SKILLS_KEY = ['skills'] as const
const skillKey = (id: string) => ['skills', id] as const

export function useSkills() {
  return useQuery({
    queryKey: SKILLS_KEY,
    queryFn: () => apiClient.get<SkillListResponse>('/api/v1/skills'),
    select: (d) => d.skills,
  })
}

export function useSkillDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? skillKey(id) : ['skills', 'none'],
    queryFn: () => apiClient.get<Skill>(`/api/v1/skills/${id}`),
    enabled: !!id,
  })
}

export function useCreateSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CustomSkillCreate) =>
      apiClient.post<Skill>('/api/v1/skills', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: SKILLS_KEY }),
  })
}

export function useUpdateSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CustomSkillUpdate }) =>
      apiClient.put<Skill>(`/api/v1/skills/${id}`, body),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: SKILLS_KEY })
      qc.invalidateQueries({ queryKey: skillKey(vars.id) })
    },
  })
}

export function useDeleteSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/v1/skills/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: SKILLS_KEY }),
  })
}

export function useGenerateSkillDraft() {
  return useMutation({
    mutationFn: (body: SkillDraftRequest) =>
      apiClient.post<SkillDraftResponse>('/api/v1/skills/generate-draft', body),
  })
}
