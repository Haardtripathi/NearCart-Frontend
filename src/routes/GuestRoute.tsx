import { Navigate, Outlet } from 'react-router-dom'

import { LoadingScreen } from '@/components/shared/LoadingScreen'
import { useAuthStore } from '@/store/authStore'

export function GuestRoute() {
  const hasRestoredSession = useAuthStore((state) => state.hasRestoredSession)
  const loading = useAuthStore((state) => state.loading)
  const user = useAuthStore((state) => state.user)

  if (!hasRestoredSession || loading) {
    return <LoadingScreen fullScreen message="Checking your NearCart session..." />
  }

  if (user) {
    return <Navigate replace to={user.dashboardPath} />
  }

  return <Outlet />
}
