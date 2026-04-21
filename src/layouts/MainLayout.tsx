import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import brandMark from '@/assets/nearkart-mark.svg'
import { primaryNavigation } from '@/routes/navigation'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { formatRoleLabel } from '@/utils/auth'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-ink-900 text-white shadow-[0_16px_30px_-20px_rgba(17,33,23,0.85)]'
      : 'text-slate-600 hover:bg-white hover:text-nearkart-700 hover:shadow-[0_16px_30px_-24px_rgba(17,33,23,0.35)]',
  ].join(' ')

export function MainLayout() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const cartCount = useCartStore((state) => state.getCartCount())
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-[rgba(252,253,248,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <NavLink className="flex items-center gap-3" to="/">
            <img
              alt="NearKart"
              className="h-11 w-11 rounded-2xl border border-white/70 bg-white/80 shadow-[0_18px_40px_-22px_rgba(17,33,23,0.6)]"
              src={brandMark}
            />
            <div>
              <p className="font-display text-lg text-ink-900">NearKart</p>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                Neighborhood Grocery
              </p>
            </div>
          </NavLink>

          <nav className="flex flex-1 flex-wrap justify-start gap-2 rounded-full border border-white/70 bg-white/60 p-2 md:w-auto md:flex-none md:justify-end">
            {primaryNavigation.map((item) => (
              <NavLink key={item.to} className={navLinkClassName} to={item.to}>
                <span className="inline-flex items-center gap-2">
                  <span>{item.label}</span>
                  {item.to === '/cart' && cartCount > 0 ? (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-current">
                      {cartCount}
                    </span>
                  ) : null}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            {user ? (
              <>
                <Link
                  className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-nearkart-200 hover:text-nearkart-700"
                  to={user.dashboardPath}
                >
                  <span>{formatRoleLabel(user.role)}</span>
                  <span className="rounded-full bg-nearkart-50 px-2 py-0.5 text-xs font-semibold text-nearkart-700">
                    Dashboard
                  </span>
                </Link>
                <button
                  className="inline-flex items-center justify-center rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-900/90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  type="button"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link
                  className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-nearkart-200 hover:text-nearkart-700"
                  to="/login"
                >
                  Sign in
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-full bg-nearkart-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-nearkart-700"
                  to="/register/customer"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-white/70 bg-white/65 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>NearKart helps nearby shoppers browse shops, build carts, and place orders with confidence.</p>
          <p>Browse local shops, manage your cart, and keep track of orders in one smooth experience.</p>
        </div>
      </footer>
    </div>
  )
}
