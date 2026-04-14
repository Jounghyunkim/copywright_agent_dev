import { useMutation } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import type {
  GenerateCopyRequest,
  GenerateCopyResponse,
} from '@/shared/api/types'

export function useGenerateCopy() {
  return useMutation({
    mutationFn: (body: GenerateCopyRequest) =>
      apiClient.post<GenerateCopyResponse>('/api/v1/campaigns/generate-copy', body),
  })
}
