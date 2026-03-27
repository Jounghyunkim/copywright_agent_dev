import { QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useUIStore } from './ui-store'

type Props = { queryClient: QueryClient }

const HEALTH_POLL_INTERVAL = 15_000 // 15 seconds, matches original App.jsx

export function EventBridge({ queryClient: _queryClient }: Props) {
  const setSseConnected = useUIStore((s) => s.setSseConnected)

  useEffect(() => {
    let active = true

    const checkHealth = async () => {
      try {
        const res = await fetch('/health')
        if (active) setSseConnected(res.ok)
      } catch {
        if (active) setSseConnected(false)
      }
    }

    // Check immediately, then poll
    checkHealth()
    const timer = setInterval(checkHealth, HEALTH_POLL_INTERVAL)

    return () => {
      active = false
      clearInterval(timer)
      setSseConnected(false)
    }
  }, [setSseConnected])

  return null
}
