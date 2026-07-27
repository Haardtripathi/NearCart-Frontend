import { useEffect, useState } from 'react'

import { getTrendingProducts } from '@/api/shops'
import { CrossShopProductCard } from '@/components/shop/CrossShopProductCard'
import type { PublicSearchResultItem } from '@/types/api'

interface TrendingRailProps {
  category?: string
  city?: string
  limit?: number
  title?: string
}

/**
 * "Trending" is v1 featured/in-stock inventory fanned out across shops, not a real popularity
 * signal (see `meta.strategy` on `/public/trending`) — labelled generically here so the UI copy
 * doesn't overclaim.
 */
export function TrendingRail({
  category,
  city,
  limit = 12,
  title = 'Popular right now',
}: TrendingRailProps) {
  const [items, setItems] = useState<PublicSearchResultItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadTrending() {
      setIsLoading(true)

      try {
        const response = await getTrendingProducts({ category, city, limit })

        if (isMounted) {
          setItems(response.items)
          setHasError(false)
        }
      } catch {
        if (isMounted) {
          setHasError(true)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadTrending()

    return () => {
      isMounted = false
    }
  }, [category, city, limit])

  if (!isLoading && !hasError && items.length === 0) {
    return null
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h2>
      </div>

      {hasError ? (
        <p className="text-sm text-ink-400">Unable to load trending products right now.</p>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-2">
          {isLoading
            ? Array.from({ length: 4 }, (_, index) => (
              <div
                key={`trending-skeleton-${index}`}
                className="h-[340px] w-64 shrink-0 animate-pulse rounded-[1.75rem] bg-ink-50"
              />
            ))
            : items.map((item) => (
              <div className="w-64 shrink-0" key={`${item.id}:${item.variantId}`}>
                <CrossShopProductCard product={item} />
              </div>
            ))}
        </div>
      )}
    </section>
  )
}
