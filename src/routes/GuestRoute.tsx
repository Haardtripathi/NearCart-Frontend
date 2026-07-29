import { Navigate, Outlet, useSearchParams } from 'react-router-dom'

import { LoadingScreen } from '@/components/shared/LoadingScreen'
import { useAuthStore } from '@/store/authStore'

export function GuestRoute() {
  const hasRestoredSession = useAuthStore((state) => state.hasRestoredSession)
  const isRestoringSession = useAuthStore((state) => state.isRestoringSession)
  const user = useAuthStore((state) => state.user)
  const [searchParams] = useSearchParams()

  if (!hasRestoredSession || isRestoringSession) {
    return <LoadingScreen fullScreen message="Checking your NearKart session..." />
  }

  if (user) {
    // Honor a `?redirect=` param the same way `ProtectedRoute` sets one when it originally
    // bounced an unauthenticated visitor to /login — otherwise an already-logged-in user landing
    // back on /login?redirect=/checkout (e.g. via browser back button) loses that destination and
    // is sent to their generic dashboard home instead.
    const rawRedirect = searchParams.get('redirect')
    // Only ever follow a same-origin relative path — a raw query param is attacker-controlled,
    // and something like `//evil.example.com` is parsed by browsers as protocol-relative.
    const redirectTo =
      rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
        ? rawRedirect
        : null

    return <Navigate replace to={redirectTo || user.dashboardPath} />
  }

  return <Outlet />
}
