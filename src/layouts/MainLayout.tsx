import { NavLink, Outlet } from 'react-router-dom'

import brandMark from '@/assets/nearcart-mark.svg'
import { primaryNavigation } from '@/routes/navigation'
import { useCartStore } from '@/store/cartStore'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-ink-900 text-white shadow-[0_16px_30px_-20px_rgba(17,33,23,0.85)]'
      : 'text-slate-600 hover:bg-white hover:text-nearcart-700 hover:shadow-[0_16px_30px_-24px_rgba(17,33,23,0.35)]',
  ].join(' ')

export function MainLayout() {
  const cartCount = useCartStore((state) => state.getCartCount())

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-[rgba(252,253,248,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <NavLink className="flex items-center gap-3" to="/">
            <img
              alt="NearCart"
              className="h-11 w-11 rounded-2xl border border-white/70 bg-white/80 shadow-[0_18px_40px_-22px_rgba(17,33,23,0.6)]"
              src={brandMark}
            />
            <div>
              <p className="font-display text-lg text-ink-900">NearCart</p>
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-white/70 bg-white/65 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>NearCart helps nearby shoppers browse shops, build carts, and place orders with confidence.</p>
          <p>Browse local shops, manage your cart, and keep track of orders in one smooth experience.</p>
        </div>
      </footer>
    </div>
  )
}
