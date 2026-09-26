/**
 * Appends a freshly fetched page to what's already on screen, dropping rows already shown. Pages
 * are offset-based, so a row inserted at the top between two page loads (a new order, a newly
 * registered shop) shifts the next page down by one and would otherwise render twice.
 */
export function appendUniqueBy<T>(current: T[], next: T[], getKey: (row: T) => string): T[] {
  const seenKeys = new Set(current.map(getKey))

  return [...current, ...next.filter((row) => !seenKeys.has(getKey(row)))]
}

export function appendUniqueById<T extends { id: string }>(current: T[], next: T[]): T[] {
  return appendUniqueBy(current, next, (row) => row.id)
}
