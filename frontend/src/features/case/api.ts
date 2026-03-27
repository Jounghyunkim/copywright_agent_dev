import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import type { DashboardData, HealthResponse } from '@/shared/api/types'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get<DashboardData>('/api/v1/campaigns/dashboard'),
  })
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get<HealthResponse>('/health'),
    refetchInterval: 15000,
    retry: false,
  })
}

export function useCampaign(id: string | null) {
  return useQuery({
    queryKey: ['campaigns', id],
    queryFn: () => apiClient.get<Record<string, unknown>>(`/api/v1/campaigns/${id}`),
    enabled: !!id,
  })
}

export function useDeleteCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/campaigns/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard'] }),
  })
}

export function useSaveCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Record<string, unknown> }) => {
      if (id) return apiClient.put(`/api/v1/campaigns/${id}`, data)
      return apiClient.post('/api/v1/campaigns/save', data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard'] }),
  })
}
