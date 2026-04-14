import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import type { HealthResponse } from '@/shared/api/types'

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get<HealthResponse>('/health'),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    retry: false,
    staleTime: 0,
  })
}
