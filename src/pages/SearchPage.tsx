import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { searchCatalog } from '@/api/shops'
import { PageHeader } from '@/components/PageHeader'
import { TrendingRail } from '@/components/home/TrendingRail'
import { CrossShopProductCard } from '@/components/shop/CrossShopProductCard'
import { StaggerGrid, StaggerItem } from '@/components/shared/StaggerGrid'
import { useCustomerCity } from '@/hooks/useCustomerCity'
import { useDeliveryCoordinates } from '@/hooks/useDeliveryCoordinates'
import type { PublicSearchResponse, PublicSearchResultItem } from '@/types/api'
import { addRecentSearch, clearRecentSearches, getRecentSearches } from '@/utils/recentSearches'

const MIN_QUERY_LENGTH = 2
const SEARCH_RESULT_LIMIT = 36

interface ShopWithMoreMatches {
  shopId: string
  shopPath: string
  shopName: string
  hiddenCount: number
}

export function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = (searchParams.get('q') ?? '').trim()
  const isValidQuery = query.length >= MIN_QUERY_LENGTH
  const { city } = useCustomerCity()
  // Search only shops that deliver to the customer's location — same rule as the shop list.
  const { coordinates } = useDeliveryCoordinates()
  const latitude = coordinates?.latitude
  const longitude = coordinates?.longitude

  const [items, setItems] = useState<PublicSearchResultItem[]>([])
  const [meta, setMeta] = useState<PublicSearchResponse['meta'] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // New feature: "recent searches" — re-read fresh on every render where it's actually shown
  // (the empty, no-query state) rather than only on mount, so a search recorded elsewhere (the
  // header search bar) or a "Clear" here shows up immediately without needing a manual refresh.
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches())

  useEffect(() => {
    if (!isValidQuery) {
      setRecentSearches(getRecentSearches())
      // Stale items are harmless here — the results grid below only renders while
      // `isValidQuery` is true, so there is nothing to synchronously reset.
      return
    }

    addRecentSearch(query)

    let isMounted = true

    async function loadSearchResults() {
      setIsLoading(true)

      try {
        const response = await searchCatalog(query, {
          city,
          limit: SEARCH_RESULT_LIMIT,
          lat: latitude,
          lng: longitude,
        })

        if (isMounted) {
          setItems(response.items)
          setMeta(response.meta)
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
  }, [query, isValidQuery, city, latitude, longitude])

  // The backend shows at most a few matches per shop, so a shop can match far more than it
  // contributes here. `meta.perShopTotals` says how many each shop matched in total; the rest are
  // one click away in that shop's own (paged) catalog search.
  const shopsWithMoreMatches = useMemo<ShopWithMoreMatches[]>(() => {
    const perShopTotals = meta?.perShopTotals

    if (!perShopTotals) {
      return []
    }

    const shownByShop = new Map<string, { item: PublicSearchResultItem; count: number }>()
    for (const item of items) {
      const entry = shownByShop.get(item.shop.id)
      shownByShop.set(item.shop.id, { item: entry?.item ?? item, count: (entry?.count ?? 0) + 1 })
    }

    return [...shownByShop.entries()]
      .map(([shopId, { item, count }]) => ({
        shopId,
        shopPath: `/shops/${item.shop.slug || shopId}?search=${encodeURIComponent(query)}`,
        shopName: item.shop.name,
        hiddenCount: (perShopTotals[shopId] ?? 0) - count,
      }))
      .filter((shop) => shop.hiddenCount > 0)
  }, [items, meta, query])

  // A full page means the backend stopped at the limit, not that these are all the matches.
  const resultCountLabel =
    items.length >= (meta?.limit ?? SEARCH_RESULT_LIMIT)
      ? `Top ${items.length} results`
      : `${items.length} result${items.length === 1 ? '' : 's'}`
  const unsearchedShopCount =
    meta?.shopsTotal != null ? Math.max(meta.shopsTotal - meta.shopsSearched, 0) : 0

  function handleRecentSearchClick(term: string) {
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  function handleClearRecentSearches() {
    clearRecentSearches()
    setRecentSearches([])
  }

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
        <section className="rounded-2xl border border-accent-100 bg-accent-50/60 p-4 text-sm text-accent-700">
          {errorMessage}
        </section>
      ) : null}

      {!isValidQuery && recentSearches.length > 0 ? (
        <section className="rounded-[2rem] border border-ink-100 bg-white/70 p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400">
              Recent searches
            </p>
            <button
              className="text-xs font-bold text-ink-400 underline-offset-2 hover:text-nearkart-600 hover:underline"
              onClick={handleClearRecentSearches}
              type="button"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <button
                className="rounded-full bg-ink-50 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-nearkart-50 hover:text-nearkart-700"
                key={term}
                onClick={() => handleRecentSearchClick(term)}
                type="button"
              >
                {term}
              </button>
            ))}
          </div>
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
        ) : errorMessage ? null : items.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-ink-100 bg-white/50 p-12 text-center">
            <div className="mb-4 text-3xl">🔍</div>
            <h3 className="font-display text-lg font-bold text-ink-900">No products found</h3>
            <p className="mt-1 text-sm text-ink-400">
              Try a different search term, or browse trending products below.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
              {resultCountLabel}
              {unsearchedShopCount > 0
                ? ` · from ${meta?.shopsSearched} of ${meta?.shopsTotal} shops`
                : null}
            </p>
            <StaggerGrid className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item) => (
                <StaggerItem key={`${item.id}:${item.variantId}`}>
                  <CrossShopProductCard product={item} />
                </StaggerItem>
              ))}
            </StaggerGrid>
            {shopsWithMoreMatches.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {shopsWithMoreMatches.map((shop) => (
                  <Link
                    className="rounded-full bg-nearkart-50 px-4 py-2 text-sm font-semibold text-nearkart-700 transition hover:bg-nearkart-100"
                    key={shop.shopId}
                    to={shop.shopPath}
                  >
                    +{shop.hiddenCount} more at {shop.shopName} →
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        )
      ) : null}

      <TrendingRail
        city={city}
        title={isValidQuery ? 'You might also like' : 'Popular right now'}
      />
    </div>
  )
}
