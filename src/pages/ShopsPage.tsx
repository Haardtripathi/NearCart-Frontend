import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getShops } from '@/api/shops'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import type { PublicShopSummary } from '@/types/api'
import { formatLiveEta, getLiveEtaTone } from '@/utils/deliveryEta'

export function ShopsPage() {
  const [shops, setShops] = useState<PublicShopSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadShops() {
      try {
        const response = await getShops()

        if (!isMounted) {
          return
        }

        setShops(response.items)
        setErrorMessage(null)
      } catch {
        if (!isMounted) {
          return
        }

        setErrorMessage('Unable to load shops right now.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadShops()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-12">
      <PageHeader
        description="Pick a nearby shop and start building your cart with fresh local groceries delivered to your door."
        eyebrow="Shop Discovery"
        title="Find your favorite shops"
      />

      {errorMessage ? (
        <section className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-600">
          {errorMessage}
        </section>
      ) : null}

      <div>
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={`shop-skeleton-${index}`}
                className="h-64 animate-pulse rounded-3xl bg-ink-50"
              />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="min-h-[400px] rounded-[2.5rem] border border-dashed border-ink-200 bg-ink-50/50 p-8 sm:p-12">
            <div className="mx-auto flex max-w-sm flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-4xl shadow-sm">
                🏪
              </div>
              <h3 className="font-display text-xl font-bold text-ink-900">No shops found yet</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                We couldn't find any registered shops in your area. Check back soon as we onboard new local partners.
              </p>
              <div className="mt-8">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-ink-900 px-6 text-sm font-bold text-white transition hover:shadow-lg active:scale-95"
                  to="/"
                >
                  Back Home
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <article
                key={shop.id}
                className="group relative flex flex-col rounded-3xl border border-ink-100 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-glass"
              >
                <div className="flex flex-1 flex-col space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-nearkart-600">
                      {shop.category}
                    </span>
                    <StatusPill
                      label={formatLiveEta(shop.liveEstimatedDeliveryMinutes)}
                      tone={getLiveEtaTone(shop.liveEstimatedDeliveryMinutes)}
                    />
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-ink-900 group-hover:text-nearkart-600 transition-colors">
                      {shop.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-ink-400">
                      {[shop.area, shop.city].filter(Boolean).join(' • ')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-2xl bg-ink-50/50 p-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Live ETA</p>
                      <p className="text-sm font-bold text-ink-900">
                        {formatLiveEta(shop.liveEstimatedDeliveryMinutes)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Min. Order</p>
                      <p className="text-sm font-bold text-ink-900">
                        ₹{shop.minimumOrderAmount}
                      </p>
                    </div>
                  </div>

                  {shop.description && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-ink-500">
                      {shop.description}
                    </p>
                  )}
                </div>

                <Link
                  className="mt-6 flex h-11 items-center justify-center rounded-xl bg-nearkart-600 px-6 text-sm font-bold text-white shadow-md shadow-nearkart-600/10 transition hover:bg-nearkart-700 active:scale-95"
                  to={`/shops/${shop.slug}`}
                >
                  Open Shop
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
