/**
 * vite.config.ts — @/ alias 설정 필수.
 *
 * 모든 컴포넌트가 `@/shared/lib/cn`, `@/shared/ui/...` 형태로 import하므로
 * 이 alias가 없으면 컴포넌트가 동작하지 않는다.
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,       // 프로젝트에 맞게 변경
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),   // ← 필수
    },
  },
})
