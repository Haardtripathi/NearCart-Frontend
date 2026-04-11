import { Link } from 'react-router-dom'

import { apiBaseUrl } from '@/api/http'
import { StatusPill } from '@/components/StatusPill'
import { useBackendHealth } from '@/hooks/useBackendHealth'
import { formatDateTime } from '@/utils/formatDateTime'

const appName = import.meta.env.VITE_APP_NAME ?? 'NearCart'

const highlightCards = [
  {
    title: 'Comfortable on every screen',
    description:
      'The storefront keeps browsing, carting, and checkout-oriented actions easy to scan on small phones and wide desktop screens alike.',
  },
  {
    title: 'Everything stays in sync',
    description:
      'Shop discovery, cart building, and order placement flow through one consistent NearCart experience from start to finish.',
  },
  {
    title: 'Built to grow cleanly',
    description:
      'Today it feels simple for shoppers, and it is ready for richer catalogs, better delivery details, and smoother order tracking next.',
  },
] as const

export function HomePage() {
  const { data, error, isLoading } = useBackendHealth()

  const connectionTone = isLoading ? 'neutral' : error ? 'danger' : 'success'
  const connectionLabel = isLoading
    ? 'Checking connection'
    : error
      ? 'Connection issue'
      : 'Everything looks good'

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-nearcart-50 via-[#fffdf7] to-sun-100 p-6 shadow-[0_30px_90px_-45px_rgba(17,33,23,0.45)] sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <StatusPill label="Customer storefront" tone="success" />
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-4xl leading-tight text-ink-900 sm:text-5xl">
                Order from nearby shops without the usual storefront clutter.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                {appName} brings together local shop discovery, cart building, and
                order flows in one clean storefront built for fast, confident neighborhood shopping.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-nearcart-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-nearcart-700"
                to="/shops"
              >
                Explore shops
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-nearcart-200 hover:text-nearcart-700"
                to="/orders"
              >
                View recent orders
              </Link>
            </div>

            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-[0_20px_40px_-32px_rgba(17,33,23,0.5)]">
                <dt className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Shopping path
                </dt>
                <dd className="mt-3 font-display text-2xl text-ink-900">
                  Shops to cart
                </dd>
              </div>
              <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-[0_20px_40px_-32px_rgba(17,33,23,0.5)]">
                <dt className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Order surface
                </dt>
                <dd className="mt-3 font-display text-2xl text-ink-900">
                  Order ready
                </dd>
              </div>
              <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-4 shadow-[0_20px_40px_-32px_rgba(17,33,23,0.5)]">
                <dt className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Experience
                </dt>
                <dd className="mt-3 font-display text-2xl text-ink-900">
                  Clear and simple
                </dd>
              </div>
            </dl>
          </div>

          <aside className="relative overflow-hidden rounded-[2rem] bg-ink-900 p-6 text-white shadow-[0_32px_90px_-45px_rgba(17,33,23,0.8)] sm:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(240,166,64,0.35),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(140,178,73,0.25),_transparent_30%)]" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                    Live store check
                  </p>
                  <h2 className="mt-2 font-display text-2xl">Storefront status</h2>
                </div>
                <StatusPill label={connectionLabel} tone={connectionTone} />
              </div>

              <div className="space-y-3 rounded-[1.5rem] bg-white/8 p-4 ring-1 ring-white/10">
                <div className="rounded-2xl bg-black/20 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/55">
                    Connection address
                    </p>
                  <p className="mt-2 break-all text-sm text-white/90">
                    {apiBaseUrl}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-black/20 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/55">
                      Store name
                    </p>
                    <p className="mt-2 text-sm text-white/90">
                      {data?.appName ?? 'Waiting for response'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-black/20 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/55">
                      Health status
                    </p>
                    <p className="mt-2 text-sm text-white/90">
                      {data?.status ?? (error ? 'error' : 'pending')}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/55">
                    Timestamp
                  </p>
                  <p className="mt-2 text-sm text-white/90">
                    {data?.timestamp ? formatDateTime(data.timestamp) : 'Pending'}
                  </p>
                </div>
                {error ? (
                  <div className="rounded-2xl bg-rose-400/15 px-4 py-3 text-sm text-rose-100 ring-1 ring-rose-300/25">
                    {error}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[1.5rem] border border-white/12 bg-white/6 p-4 text-sm text-white/80">
                NearCart keeps the shopping experience focused here, so customers can browse and order without extra complexity.
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {highlightCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)] backdrop-blur"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
              Why shoppers like it
            </p>
            <h2 className="mt-3 font-display text-2xl text-ink-900">
              {card.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {card.description}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <article className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
            How it feels
          </p>
          <ol className="mt-5 space-y-4">
            {[
              'Discover nearby shops and open a storefront that feels quick and easy to browse.',
              'Build a cart from one shop at a time so prices, totals, and order details stay clear.',
              'Move from product selection to checkout with a smooth flow that is ready for future upgrades.',
            ].map((item, index) => (
              <li
                key={item}
                className="flex gap-4 rounded-2xl bg-nearcart-50 px-4 py-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nearcart-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="text-sm leading-7 text-slate-700">{item}</span>
              </li>
            ))}
          </ol>
        </article>

        <article className="rounded-[1.75rem] border border-white/80 bg-slate-950 p-6 text-white shadow-[0_30px_90px_-55px_rgba(17,33,23,0.9)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
            Ready next
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              'Richer shop discovery and search',
              'Live inventory-aware product detail flows',
              'Smoother cart, checkout, and order tracking',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4 text-sm leading-7 text-white/80"
              >
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
