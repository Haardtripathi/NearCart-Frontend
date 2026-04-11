import { Navigate, Outlet } from 'react-router-dom'

import type { UserRole } from '@/types/auth'
import { useAuthStore } from '@/store/authStore'

interface RoleRouteProps {
  allowedRoles: UserRole[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate replace to="/login" />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate replace to={user.dashboardPath} />
  }

  return <Outlet />
}
