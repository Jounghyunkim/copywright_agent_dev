import { useMutation } from '@tanstack/react-query'

import { postFormData } from '@/shared/api/client'
import type {
  MessageMatrixParseResponse,
  MessageMatrixSheetsResponse,
} from '@/shared/api/types'

export function useMessageMatrixSheets() {
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return postFormData<MessageMatrixSheetsResponse>(
        '/api/v1/message-matrix/sheets',
        fd,
      )
    },
  })
}

export function useMessageMatrixParse() {
  return useMutation({
    mutationFn: ({ file, sheets }: { file: File; sheets: string[] }) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('sheets', sheets.join(','))
      return postFormData<MessageMatrixParseResponse>(
        '/api/v1/message-matrix/parse',
        fd,
      )
    },
  })
}
