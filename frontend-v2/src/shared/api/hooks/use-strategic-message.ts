import { useMutation } from '@tanstack/react-query'
import i18n from 'i18next'

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
        {
          ...body,
          locale: body.locale ?? i18n.language ?? 'ko',
        },
      ),
  })
}
