import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getTrendingProducts, searchCatalog } from '@/api/shops'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { PublicSearchResultItem } from '@/types/api'
import { formatCurrency } from '@/utils/formatCurrency'

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
  const [searchResults, setSearchResults] = useState<PublicSearchResultItem[]>([])
  const [trendingResults, setTrendingResults] = useState<PublicSearchResultItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedTrending, setHasLoadedTrending] = useState(false)

  const debouncedQuery = useDebouncedValue(query.trim(), 300)
  const isSearchActive = debouncedQuery.length >= MIN_QUERY_LENGTH

  useEffect(() => {
    if (!isSearchActive) {
      // Stale results are harmless here — `displayItems` below only reads `searchResults`
      // while `isSearchActive` is true, so there is nothing to synchronously reset.
      return
    }

    let isMounted = true

    async function loadSearchResults() {
      setIsLoading(true)

      try {
        const response = await searchCatalog(debouncedQuery, { limit: 6 })

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
  }, [debouncedQuery, isSearchActive])

  useEffect(() => {
    if (!isOpen || isSearchActive || hasLoadedTrending) {
      return
    }

    let isMounted = true

    async function loadTrending() {
      try {
        const response = await getTrendingProducts({ limit: 6 })

        if (isMounted) {
          setTrendingResults(response.items)
        }
      } catch {
        if (isMounted) {
          setTrendingResults([])
        }
      } finally {
        if (isMounted) {
          setHasLoadedTrending(true)
        }
      }
    }

    void loadTrending()

    return () => {
      isMounted = false
    }
  }, [isOpen, isSearchActive, hasLoadedTrending])

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

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()

    if (trimmed.length < MIN_QUERY_LENGTH) {
      return
    }

    setIsOpen(false)
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  function handleResultClick() {
    setIsOpen(false)
  }

  const displayItems = isSearchActive ? searchResults : trendingResults
  const sectionLabel = isSearchActive ? 'Products' : 'Popular right now'
  const showLoading = isSearchActive && isLoading

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 rounded-full border border-ink-100 bg-white px-4 py-2 shadow-sm transition focus-within:border-nearkart-300 focus-within:ring-1 focus-within:ring-nearkart-200">
          <span aria-hidden="true" className="text-ink-300">
            🔍
          </span>
          <input
            className="w-full border-none bg-transparent text-sm font-medium text-ink-900 outline-none placeholder:text-ink-300"
            onChange={(event) => {
              setQuery(event.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search products across shops..."
            type="search"
            value={query}
          />
        </div>
      </form>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-[28rem] overflow-y-auto rounded-3xl border border-ink-100 bg-white p-3 shadow-glass-strong">
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
