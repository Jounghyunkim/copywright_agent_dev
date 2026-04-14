import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import type {
  CampaignDeleteResponse,
  CampaignDetail,
  CampaignSaveRequest,
  CampaignSaveResponse,
} from '@/shared/api/types'

const DASHBOARD_KEY = ['dashboard'] as const
const campaignKey = (id: string) => ['campaign', id] as const

export function useCampaign(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? campaignKey(id) : ['campaign', 'none'],
    queryFn: () => apiClient.get<CampaignDetail>(`/api/v1/campaigns/${id}`),
    enabled: !!id,
  })
}

export function useSaveCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CampaignSaveRequest) =>
      apiClient.post<CampaignSaveResponse>('/api/v1/campaigns/save', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: DASHBOARD_KEY }),
  })
}

export function useUpdateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CampaignSaveRequest }) =>
      apiClient.put<CampaignSaveResponse>(`/api/v1/campaigns/${id}`, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY })
      qc.invalidateQueries({ queryKey: campaignKey(vars.id) })
    },
  })
}

export function useDeleteCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<CampaignDeleteResponse>(`/api/v1/campaigns/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: DASHBOARD_KEY }),
  })
}
