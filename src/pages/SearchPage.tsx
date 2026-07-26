import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { searchCatalog } from '@/api/shops'
import { PageHeader } from '@/components/PageHeader'
import { TrendingRail } from '@/components/home/TrendingRail'
import { CrossShopProductCard } from '@/components/shop/CrossShopProductCard'
import type { PublicSearchResultItem } from '@/types/api'

const MIN_QUERY_LENGTH = 2

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = (searchParams.get('q') ?? '').trim()
  const isValidQuery = query.length >= MIN_QUERY_LENGTH

  const [items, setItems] = useState<PublicSearchResultItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isValidQuery) {
      // Stale items are harmless here — the results grid below only renders while
      // `isValidQuery` is true, so there is nothing to synchronously reset.
      return
    }

    let isMounted = true

    async function loadSearchResults() {
      setIsLoading(true)

      try {
        const response = await searchCatalog(query, { limit: 36 })

        if (isMounted) {
          setItems(response.items)
          setErrorMessage(null)
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Unable to search right now.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSearchResults()

    return () => {
      isMounted = false
    }
  }, [query, isValidQuery])

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Search"
        title={isValidQuery ? `Results for "${query}"` : 'Search NearKart'}
        description={
          isValidQuery
            ? 'Products matching your search, pulled live from shops near you.'
            : 'Type at least 2 characters in the search bar above to find products across every shop.'
        }
      />

      {errorMessage ? (
        <section className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-600">
          {errorMessage}
        </section>
      ) : null}

      {isValidQuery ? (
        isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={`search-result-skeleton-${index}`}
                className="h-[340px] animate-pulse rounded-[1.75rem] bg-ink-50"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-ink-100 bg-white/50 p-12 text-center">
            <div className="mb-4 text-3xl">🔍</div>
            <h3 className="font-display text-lg font-bold text-ink-900">No products found</h3>
            <p className="mt-1 text-sm text-ink-400">
              Try a different search term, or browse trending products below.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <CrossShopProductCard key={`${item.id}:${item.variantId}`} product={item} />
            ))}
          </div>
        )
      ) : null}

      <TrendingRail title={isValidQuery ? 'You might also like' : 'Popular right now'} />
    </div>
  )
}
