import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { LoadingScreen } from '@/components/shared/LoadingScreen'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute() {
  const location = useLocation()
  const hasRestoredSession = useAuthStore((state) => state.hasRestoredSession)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const loading = useAuthStore((state) => state.loading)

  if (!hasRestoredSession || loading) {
    return <LoadingScreen fullScreen message="Restoring your NearKart session..." />
  }

  if (!isAuthenticated) {
    const redirectTo = `${location.pathname}${location.search}`

    return <Navigate replace to={`/login?redirect=${encodeURIComponent(redirectTo)}`} />
  }

  return <Outlet />
}
