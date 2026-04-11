import { useEffect } from 'react'

import { useAuthStore } from '@/store/authStore'

export function AuthBootstrap() {
  const hasRestoredSession = useAuthStore((state) => state.hasRestoredSession)
  const restoreSession = useAuthStore((state) => state.restoreSession)

  useEffect(() => {
    if (!hasRestoredSession) {
      void restoreSession()
    }
  }, [hasRestoredSession, restoreSession])

  return null
}
