import { Navigate } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'

export function DashboardIndexPage() {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate replace to="/login" />
  }

  return <Navigate replace to={user.dashboardPath} />
}
