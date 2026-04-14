import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import type { DashboardData } from '@/shared/api/types'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get<DashboardData>('/api/v1/campaigns/dashboard'),
  })
}
