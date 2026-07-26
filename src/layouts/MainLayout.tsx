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
      <header className="sticky top-0 z-20 border-b border-ink-100/50 bg-[rgba(252,253,248,0.85)] backdrop-blur-xl transition-all">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-4 sm:px-8 lg:px-10">
          <NavLink className="flex items-center gap-3 transition-transform hover:scale-[1.02]" to="/">
            <img
              alt="NearKart"
              className="h-10 w-10 rounded-xl border border-white/70 bg-white/80 shadow-md"
              src={brandMark}
            />
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-ink-900">NearKart</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-nearkart-600/80">
                Local Commerce
              </p>
            </div>
          </NavLink>

          <nav className="flex flex-1 flex-wrap justify-start gap-1 rounded-2xl border border-ink-100/50 bg-ink-50/30 p-1 md:w-auto md:flex-none md:justify-end">
            {primaryNavigation.map((item) => (
              <NavLink key={item.to} className={navLinkClassName} to={item.to}>
                <span className="inline-flex items-center gap-2">
                  <span>{item.label}</span>
                  {item.to === '/cart' && cartCount > 0 ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-nearkart-600 px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                      {cartCount}
                    </span>
                  ) : null}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <Link
                  className="group inline-flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition-all hover:border-nearkart-300 hover:bg-nearkart-50"
                  to={user.dashboardPath}
                >
                  <span className="text-xs text-ink-400 group-hover:text-nearkart-600 transition-colors">{formatRoleLabel(user.role)}</span>
                  <span className="font-semibold text-ink-900 underline decoration-nearkart-200 underline-offset-4 group-hover:decoration-nearkart-400 transition-all">
                    Dashboard
                  </span>
                </Link>
                <button
                  className="inline-flex items-center justify-center rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-ink-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  type="button"
                >
                  {isLoggingOut ? 'Leaving...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
                  to="/login"
                >
                  Sign in
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-xl bg-nearkart-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-nearkart-600/20 transition hover:bg-nearkart-700 hover:shadow-lg active:scale-95"
                  to="/register/customer"
                >
                  Join NearKart
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-16">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-ink-100 bg-white transition-colors">
        <div className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-8 sm:py-16 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img alt="NearKart" className="h-8 w-8 opacity-90" src={brandMark} />
                <span className="font-display text-xl font-bold tracking-tight text-ink-900">NearKart</span>
              </div>
              <p className="max-w-xs text-sm leading-7 text-ink-500">
                Connecting neighborhood shoppers with local stores for a cleaner, more sustainable commerce experience.
              </p>
              <div className="flex gap-4">
                {/* Social icons placeholder */}
                <div className="h-8 w-8 rounded-lg bg-ink-50" />
                <div className="h-8 w-8 rounded-lg bg-ink-50" />
                <div className="h-8 w-8 rounded-lg bg-ink-50" />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-ink-900">Marketplace</h4>
              <ul className="mt-6 space-y-4 text-sm text-ink-500">
                <li><Link className="hover:text-nearkart-600 transition" to="/shops">Browse Shops</Link></li>
                <li><Link className="hover:text-nearkart-600 transition" to="/shops">Special Offers</Link></li>
                <li><Link className="hover:text-nearkart-600 transition" to="/shops">New Arrivals</Link></li>
                <li><Link className="hover:text-nearkart-600 transition" to="/shops">Delivery Areas</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-ink-900">Resources</h4>
              <ul className="mt-6 space-y-4 text-sm text-ink-500">
                <li><Link className="hover:text-nearkart-600 transition" to="/">Help Center</Link></li>
                <li><Link className="hover:text-nearkart-600 transition" to="/">Merchant Guide</Link></li>
                <li><Link className="hover:text-nearkart-600 transition" to="/">Rider Support</Link></li>
                <li><Link className="hover:text-nearkart-600 transition" to="/">Privacy Policy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-ink-900">Join the Mission</h4>
              <ul className="mt-6 space-y-4 text-sm text-ink-500">
                <li><Link className="hover:text-nearkart-600 transition" to="/register/customer">Become a Shopper</Link></li>
                <li><Link className="hover:text-nearkart-600 transition" to="/register/shop-owner">Register as Seller</Link></li>
                <li><Link className="hover:text-nearkart-600 transition" to="/">Apply as Rider</Link></li>
                <li><Link className="hover:text-nearkart-600 transition" to="/">Careers</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-6 border-t border-ink-50 pt-8 text-xs font-medium text-ink-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 NearKart Commerce. All rights reserved.</p>
            <div className="flex gap-8">
              <button className="hover:text-ink-600 transition">Terms</button>
              <button className="hover:text-ink-600 transition">Privacy</button>
              <button className="hover:text-ink-600 transition">Cookies</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
