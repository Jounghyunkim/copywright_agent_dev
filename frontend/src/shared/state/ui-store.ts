import { create } from 'zustand'
import type { Locale } from '@/shared/i18n/locales'

interface UIState {
  sseConnected: boolean
  setSseConnected: (v: boolean) => void
  processingStatus: string
  setProcessingStatus: (v: string) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  toasts: Array<{ id: string; message: string; type: 'info' | 'success' | 'error' }>
  addToast: (message: string, type?: 'info' | 'success' | 'error') => void
  removeToast: (id: string) => void
  locale: Locale
  setLocale: (v: Locale) => void
}

function loadLocale(): Locale {
  const saved = localStorage.getItem('app-locale')
  if (saved === 'en' || saved === 'ko' || saved === 'de') return saved
  return 'ko'
}

export const useUIStore = create<UIState>((set) => ({
  sseConnected: false,
  setSseConnected: (v) => set({ sseConnected: v }),
  processingStatus: '',
  setProcessingStatus: (v) => set({ processingStatus: v }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
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
  locale: loadLocale(),
  setLocale: (v) => {
    localStorage.setItem('app-locale', v)
    set({ locale: v })
  },
}))
