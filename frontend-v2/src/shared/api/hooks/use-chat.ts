import { useMutation } from '@tanstack/react-query'

import { apiClient } from '@/shared/api/client'
import type { ChatRequest, ChatResponse } from '@/shared/api/types'

export function useChat() {
  return useMutation({
    mutationFn: (body: ChatRequest) =>
      apiClient.post<ChatResponse>('/api/v1/campaigns/chat', body),
  })
}
