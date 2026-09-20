// New feature (adversarial sweep pass): "recent searches" quick-recall, mirroring
// `utils/guestOrders.ts`'s localStorage-list pattern exactly for consistency. Purely a client-side
// convenience — no backend/schema involvement, so it works identically for guests and signed-in
// customers and never leaks a customer's search history to the server. Most-recent-first, deduped
// (a repeated search just moves back to the front rather than appearing twice), capped at 8 so the
// dropdown/chip row never grows unbounded.
const recentSearchesStorageKey = 'nearkart-recent-searches'
const MAX_RECENT_SEARCHES = 8

export function getRecentSearches(): string[] {
  const rawValue = localStorage.getItem(recentSearchesStorageKey)

  if (!rawValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(rawValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    )
  } catch {
    return []
  }
}

export function addRecentSearch(query: string) {
  const trimmed = query.trim()

  if (!trimmed) {
    return
  }

  const normalized = trimmed.toLowerCase()
  const nextSearches = [
    trimmed,
    ...getRecentSearches().filter((existing) => existing.toLowerCase() !== normalized),
  ]

  try {
    localStorage.setItem(
      recentSearchesStorageKey,
      JSON.stringify(nextSearches.slice(0, MAX_RECENT_SEARCHES)),
    )
  } catch {
    // Storage full/disabled (private browsing) — recent searches just won't persist, no worse
    // than not having the feature at all.
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(recentSearchesStorageKey)
  } catch {
    // Nothing to do if storage access itself throws.
  }
}
