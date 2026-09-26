import { useEffect, useRef, useState, type FormEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getTrendingProducts, searchCatalog } from '@/api/shops'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDeliveryCoordinates } from '@/hooks/useDeliveryCoordinates'
import type { PublicSearchResultItem } from '@/types/api'
import { formatCurrency } from '@/utils/formatCurrency'
import { addRecentSearch, clearRecentSearches, getRecentSearches } from '@/utils/recentSearches'

const MIN_QUERY_LENGTH = 2

/**
 * Debounced search-with-suggestions dropdown mounted in the header. Below 2 characters it shows
 * `/public/trending` results as "Popular right now" (the app's stand-in for a suggestions tier —
 * see plan notes); at 2+ characters (after a ~300ms debounce) it calls `/public/search`.
 */
export function HeaderSearchBar() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  // Latches on the first open. This bar is in the layout of every page (login, cart, checkout...),
  // so it must not ask for the device location — and trigger the browser prompt — until the
  // customer actually starts searching.
  const [hasOpened, setHasOpened] = useState(false)
  const [searchResults, setSearchResults] = useState<PublicSearchResultItem[]>([])
  const [trendingResults, setTrendingResults] = useState<PublicSearchResultItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // Which delivery location the trending list was loaded for — a changed location reloads it.
  const [loadedTrendingKey, setLoadedTrendingKey] = useState<string | null>(null)
  // New feature: "recent searches" quick-recall — read once on open (not reactively) since it
  // only changes as a result of this component's own submit/clear actions, both of which already
  // re-read it explicitly right after.
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const debouncedQuery = useDebouncedValue(query.trim(), 300)
  const isSearchActive = debouncedQuery.length >= MIN_QUERY_LENGTH
  // Suggestions only from shops that deliver to the customer's location (same rule as the shop
  // list); without it the dropdown offered products from shops that can't deliver here.
  const { coordinates, isLocating } = useDeliveryCoordinates({ enableDeviceLocation: hasOpened })
  const latitude = coordinates?.latitude
  const longitude = coordinates?.longitude
  const coordinatesKey = latitude != null && longitude != null ? `${latitude},${longitude}` : ''

  useEffect(() => {
    // Wait for the location to settle so a GPS-only customer gets one scoped request, not an
    // unscoped one followed by a scoped one seconds later.
    if (!isSearchActive || isLocating) {
      // Stale results are harmless here — `displayItems` below only reads `searchResults`
      // while `isSearchActive` is true, so there is nothing to synchronously reset.
      return
    }

    let isMounted = true

    async function loadSearchResults() {
      setIsLoading(true)

      try {
        const response = await searchCatalog(debouncedQuery, {
          limit: 6,
          lat: latitude,
          lng: longitude,
        })

        if (isMounted) {
          setSearchResults(response.items)
        }
      } catch {
        if (isMounted) {
          setSearchResults([])
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
  }, [debouncedQuery, isSearchActive, isLocating, latitude, longitude])

  useEffect(() => {
    if (!isOpen || isSearchActive || isLocating || loadedTrendingKey === coordinatesKey) {
      return
    }

    let isMounted = true

    async function loadTrending() {
      try {
        const response = await getTrendingProducts({ limit: 6, lat: latitude, lng: longitude })

        if (isMounted) {
          setTrendingResults(response.items)
        }
      } catch {
        if (isMounted) {
          setTrendingResults([])
        }
      } finally {
        if (isMounted) {
          setLoadedTrendingKey(coordinatesKey)
        }
      }
    }

    void loadTrending()

    return () => {
      isMounted = false
    }
  }, [isOpen, isSearchActive, isLocating, loadedTrendingKey, coordinatesKey, latitude, longitude])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  // New feature: refresh the recent-searches list every time the dropdown opens (cheap localStorage
  // read) rather than only once on mount, so a search made from elsewhere (e.g. SearchPage.tsx)
  // shows up here the next time this dropdown is reopened.
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches())
    }
  }, [isOpen])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()

    if (trimmed.length < MIN_QUERY_LENGTH) {
      return
    }

    addRecentSearch(trimmed)
    setIsOpen(false)
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  function handleRecentSearchClick(term: string) {
    addRecentSearch(term)
    setIsOpen(false)
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  function handleClearRecentSearches(event: ReactMouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    clearRecentSearches()
    setRecentSearches([])
  }

  function handleResultClick() {
    setIsOpen(false)
  }

  const displayItems = isSearchActive ? searchResults : trendingResults
  const sectionLabel = isSearchActive ? 'Products' : 'Popular right now'
  const showLoading = isSearchActive && (isLoading || isLocating)

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 rounded-full border border-ink-100 bg-ink-50/60 px-4 py-2 transition focus-within:border-nearkart-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-nearkart-100">
          <span aria-hidden="true" className="text-base text-ink-400">
            🔍
          </span>
          <input
            className="w-full border-none bg-transparent text-sm font-medium text-ink-900 outline-none placeholder:text-ink-400"
            onChange={(event) => {
              setQuery(event.target.value)
              setIsOpen(true)
              setHasOpened(true)
            }}
            onFocus={() => {
              setIsOpen(true)
              setHasOpened(true)
            }}
            placeholder="Search products across shops..."
            type="search"
            value={query}
          />
        </div>
      </form>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-[28rem] overflow-y-auto rounded-3xl border border-ink-100 bg-white p-3 shadow-glass-strong">
          {/* New feature: recent searches — only makes sense before the customer has typed enough
              to trigger a live search (isSearchActive), otherwise it'd just clutter the results
              they're already looking at. */}
          {!isSearchActive && recentSearches.length > 0 ? (
            <div className="mb-2 border-b border-ink-50 pb-2">
              <div className="flex items-center justify-between px-2 pb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400">
                  Recent searches
                </p>
                <button
                  className="text-[10px] font-bold text-ink-400 underline-offset-2 hover:text-nearkart-600 hover:underline"
                  onClick={handleClearRecentSearches}
                  type="button"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2 px-2">
                {recentSearches.map((term) => (
                  <button
                    className="rounded-full bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-nearkart-50 hover:text-nearkart-700"
                    key={term}
                    onClick={() => handleRecentSearchClick(term)}
                    type="button"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-nearkart-600">
            {sectionLabel}
          </p>

          {showLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={`search-skeleton-${index}`} className="h-14 animate-pulse rounded-2xl bg-ink-50" />
              ))}
            </div>
          ) : displayItems.length === 0 ? (
            <p className="px-2 py-4 text-sm text-ink-400">
              {isSearchActive ? 'No products found.' : 'Nothing trending yet.'}
            </p>
          ) : (
            <ul className="space-y-1">
              {displayItems.map((item) => (
                <li key={`${item.id}:${item.variantId}`}>
                  <Link
                    className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-ink-50"
                    onClick={handleResultClick}
                    to={`/shops/${item.shop.slug}`}
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-nearkart-50">
                      {item.image ? (
                        <img alt={item.name} className="h-full w-full object-cover" src={item.image} />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink-900">{item.name}</p>
                      <p className="truncate text-xs text-ink-400">{item.shop.name}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-ink-900">
                      {formatCurrency(item.price)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {isSearchActive ? (
            <Link
              className="mt-2 block rounded-2xl px-2 py-2 text-center text-xs font-bold text-nearkart-600 hover:bg-nearkart-50"
              onClick={handleResultClick}
              to={`/search?q=${encodeURIComponent(debouncedQuery)}`}
            >
              View all results for "{debouncedQuery}"
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
