import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getShops } from '@/api/shops'
import { PageHeader } from '@/components/PageHeader'
import { PlaceholderPanel } from '@/components/PlaceholderPanel'
import type { ShopPreview } from '@/types/api'

export function ShopsPage() {
  const [shops, setShops] = useState<ShopPreview[]>([])
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Shop discovery"
        title="Pick a nearby shop and start building your cart."
        description="Browse nearby stores, open a shop, and add items with a clear one-shop-at-a-time cart experience."
      />

      {errorMessage ? (
        <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }, (_, index) => (
              <div
                key={`shop-skeleton-${index}`}
                className="h-64 animate-pulse rounded-[1.75rem] border border-white/80 bg-white/70"
              />
            ))
          : shops.map((shop) => (
          <article
            key={shop.id}
            className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
              {shop.category}
            </p>
            <h2 className="mt-3 font-display text-2xl text-ink-900">
              {shop.name}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{shop.neighborhood}</p>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-nearcart-50 px-4 py-3 text-sm text-slate-700">
              <span>Estimated delivery</span>
              <span className="font-semibold text-nearcart-700">
                {shop.etaMinutes} mins
              </span>
            </div>
            <Link
              className="mt-6 inline-flex rounded-full bg-nearcart-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-nearcart-700"
              to={`/shops/${shop.id}`}
            >
              Open shop
            </Link>
          </article>
            ))}
      </section>

      <PlaceholderPanel
        title="Cart-ready browsing"
        description="Everything is set up so browsing feels simple, while your cart stays clear and consistent as you move between pages."
        points={[
          'Your cart keeps the product details you selected.',
          'One shop stays active in the cart at a time for a cleaner shopping flow.',
          'The experience is ready for richer stock and checkout improvements next.',
        ]}
      />
    </div>
  )
}
