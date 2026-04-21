import { useEffect, useState } from 'react'

import { getHealthStatus } from '@/api/health'
import type { HealthResponse } from '@/types/api'

interface BackendHealthState {
  data: HealthResponse | null
  error: string | null
  isLoading: boolean
}

export function useBackendHealth() {
  const [state, setState] = useState<BackendHealthState>({
    data: null,
    error: null,
    isLoading: true,
  })

  useEffect(() => {
    let isMounted = true

    const loadHealth = async (isInitialLoad = false) => {
      if (isInitialLoad && isMounted) {
        setState((currentState) => ({
          ...currentState,
          isLoading: true,
        }))
      }

      try {
        const data = await getHealthStatus()

        if (!isMounted) {
          return
        }

        setState({
          data,
          error: null,
          isLoading: false,
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setState({
          data: null,
          error:
            error instanceof Error
              ? error.message
              : 'Unable to reach NearKart right now.',
          isLoading: false,
        })
      }
    }

    void loadHealth(true)
    const intervalId = window.setInterval(() => {
      void loadHealth()
    }, 15000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  return state
}
