import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import '@/shared/styles/tokens.css'
import '@/shared/styles/globals.css'

// i18n 초기화 — import 시점에 i18next가 init 되며, 이후 RouterProvider 가 구독.
import '@/shared/i18n'
import { setupHtmlDirSync, waitForI18n } from '@/shared/i18n'

import { router } from '@/app/router'
import { AppProviders } from '@/app/providers'

setupHtmlDirSync()

// 초기 렌더 전에 번역 리소스 로드 완료까지 대기 → key flash 방지.
void waitForI18n().then(() => {
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </React.StrictMode>,
  )
})
