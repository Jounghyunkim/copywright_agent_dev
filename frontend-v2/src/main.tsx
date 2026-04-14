import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import '@/shared/styles/tokens.css'
import '@/shared/styles/globals.css'

import { router } from '@/app/router'
import { AppProviders } from '@/app/providers'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
)
