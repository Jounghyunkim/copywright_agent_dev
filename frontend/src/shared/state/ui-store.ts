import { create } from 'zustand'

interface UIState {
  sseConnected: boolean
  setSseConnected: (v: boolean) => void
  processingStatus: string
  setProcessingStatus: (v: string) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  toasts: Array<{ id: string; message: string; type: 'info' | 'success' | 'error' }>
  addToast: (message: string, type?: 'info' | 'success' | 'error') => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sseConnected: false,
  setSseConnected: (v) => set({ sseConnected: v }),
  processingStatus: '',
  setProcessingStatus: (v) => set({ processingStatus: v }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
