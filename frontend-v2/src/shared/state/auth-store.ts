import { create } from 'zustand'

import type { UserInfo } from '@/shared/api/types'

interface AuthState {
  user: UserInfo | null
  setUser: (user: UserInfo) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
