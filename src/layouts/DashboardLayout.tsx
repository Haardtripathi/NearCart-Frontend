import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import brandMark from '@/assets/nearcart-mark.svg'
import { StatusPill } from '@/components/StatusPill'
import { formatRoleLabel } from '@/utils/auth'
import { useAuthStore } from '@/store/authStore'

interface NavigationItem {
  label: string
  to: string
}

const navigationByRole = {
  CUSTOMER: [
    { label: 'Overview', to: '/dashboard/customer' },
    { label: 'Profile', to: '/dashboard/customer/profile' },
    { label: 'Addresses', to: '/dashboard/customer/addresses' },
    { label: 'Orders', to: '/dashboard/customer/orders' },
  ],
  SHOP_OWNER: [
    { label: 'Overview', to: '/dashboard/shop-owner' },
    { label: 'Profile', to: '/dashboard/shop-owner/profile' },
    { label: 'Shops', to: '/dashboard/shop-owner/shops' },
    { label: 'New Shop', to: '/dashboard/shop-owner/shops/new' },
  ],
  ADMIN: [
    { label: 'Overview', to: '/dashboard/admin' },
    { label: 'Users', to: '/dashboard/admin/users' },
    { label: 'Shops', to: '/dashboard/admin/shops' },
    { label: 'Orders', to: '/dashboard/admin/orders' },
    { label: 'Approvals', to: '/dashboard/admin/approvals' },
  ],
  RIDER: [] satisfies NavigationItem[],
}

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition',
    isActive
      ? 'bg-ink-900 text-white shadow-[0_18px_35px_-24px_rgba(17,33,23,0.85)]'
      : 'text-slate-600 hover:bg-white hover:text-nearcart-700',
  ].join(' ')

export function DashboardLayout() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const navigationItems = useMemo(() => {
    if (!user) {
      return [] as NavigationItem[]
    }

    const role = (user.role ?? 'CUSTOMER') as keyof typeof navigationByRole
    return navigationByRole[role] ?? []
  }, [user])

  if (!user) {
    return null
  }

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logout()
      navigate('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(252,253,248,0.88),rgba(241,243,232,0.95))]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-5 lg:grid-cols-[280px_1fr] lg:px-6">
        <aside className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-[0_20px_70px_-50px_rgba(17,33,23,0.45)] backdrop-blur">
          <Link className="flex items-center gap-3" to="/">
            <img
              alt="NearCart"
              className="h-11 w-11 rounded-2xl border border-white/80 bg-white/90 p-2"
              src={brandMark}
            />
            <div>
              <p className="font-display text-lg text-ink-900">NearCart</p>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                Dashboard
              </p>
            </div>
          </Link>

          <div className="mt-8 rounded-[1.5rem] bg-nearcart-50/90 p-4">
            <p className="text-sm font-semibold text-ink-900">{user.fullName}</p>
            <p className="mt-1 text-sm text-slate-600">{user.email}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusPill label={formatRoleLabel(user.role)} tone="success" />
              {!user.isVerified ? (
                <StatusPill label="Unverified" tone="warning" />
              ) : null}
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navigationItems.map((item) => (
              <NavLink key={item.to} className={navLinkClassName} end to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 space-y-3">
            <Link
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-nearcart-200 hover:text-nearcart-700"
              to="/shops"
            >
              Back to storefront
            </Link>
            <button
              className="inline-flex w-full items-center justify-center rounded-full bg-ink-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink-900/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoggingOut}
              onClick={handleLogout}
              type="button"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </aside>

        <div className="space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/80 bg-white/85 px-6 py-5 shadow-[0_20px_70px_-50px_rgba(17,33,23,0.35)] backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
                NearCart workspace
              </p>
              <h1 className="mt-2 font-display text-3xl text-ink-900">
                {formatRoleLabel(user.role)} Dashboard
              </h1>
            </div>
            <div className="rounded-[1.4rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Manage your role-specific workflows while the public storefront keeps running for shoppers.
            </div>
          </header>

          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
