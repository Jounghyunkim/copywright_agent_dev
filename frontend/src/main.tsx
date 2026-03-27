import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/shared/styles/globals.css'
import { Providers } from '@/app/providers'
import { AppRouter } from '@/app/router'
import { ToastContainer } from '@/shared/ui/toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <AppRouter />
      <ToastContainer />
    </Providers>
  </StrictMode>,
)
