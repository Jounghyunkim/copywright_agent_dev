import { useMutation } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import type {
  StrategicMessageRequest,
  StrategicMessageResponse,
} from '@/shared/api/types'

export function useStrategicMessage() {
  return useMutation({
    mutationFn: (body: StrategicMessageRequest) =>
      apiClient.post<StrategicMessageResponse>(
        '/api/v1/campaigns/strategic-message',
        body,
      ),
  })
}
