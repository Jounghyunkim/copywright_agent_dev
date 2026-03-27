import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'

export function useApprove() {
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/v1/approvals/${id}/approve`),
  })
}
