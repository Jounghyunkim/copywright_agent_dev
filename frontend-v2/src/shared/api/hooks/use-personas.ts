import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import type { AIPersona, CultureProfile } from '@/shared/api/types'

export function usePersonas() {
  return useQuery({
    queryKey: ['personas'],
    queryFn: () => apiClient.get<AIPersona[]>('/api/v1/personas'),
  })
}

export function useCultureProfiles() {
  return useQuery({
    queryKey: ['culture-profiles'],
    queryFn: () => apiClient.get<CultureProfile[]>('/api/v1/culture-profiles'),
  })
}
