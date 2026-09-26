import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

import type { PagedListMeta } from '@/types/api'
import { getApiErrorMessage } from '@/utils/api'
import { appendUniqueBy } from '@/utils/pagedList'

interface PagedResponse<T> {
  items: T[]
  meta: PagedListMeta & { total?: number; matched?: number }
}

interface UseLoadMoreOptions<T> {
  // Fetches one page (1-based). Read through a ref, so an inline arrow is fine.
  fetchPage: (page: number) => Promise<PagedResponse<T>>
  setItems: Dispatch<SetStateAction<T[]>>
  // Which meta field is the full count. Admin lists use `total`; customer orders and the shop
  // directory use `matched` (their `total` is only the current page's size).
  countField?: 'total' | 'matched'
  errorMessage?: string
  // Row identity for de-duplicating across pages. Defaults to `row.id`.
  getKey?: (item: T) => string
}

function getRowId(item: unknown): string {
  return (item as { id: string }).id
}

/**
 * "Load more" state for a server-paged list whose first page the page component loads itself.
 * Call `resetFromFirstPage(response)` after putting page 1 on screen; `loadMore()` then appends
 * page 2, 3, ... (deduped by id) until `meta.hasMore` is false. The component keeps owning its
 * `items` state, so local edits (e.g. saving a shop's mapping) keep working unchanged.
 */
export function useLoadMore<T>({
  fetchPage,
  setItems,
  countField = 'total',
  errorMessage = 'Unable to load more right now.',
  getKey = getRowId,
}: UseLoadMoreOptions<T>) {
  const [loadedPage, setLoadedPage] = useState(1)
  const loadedPageRef = useRef(loadedPage)
  loadedPageRef.current = loadedPage
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const fetchPageRef = useRef(fetchPage)
  fetchPageRef.current = fetchPage
  const isMountedRef = useRef(true)
  // Bumped by every `resetFromFirstPage`. A "Load more" that was in flight when the list was
  // reloaded (filters changed, an approval was decided) belongs to the old list: appending it
  // would mix in the old filter's rows and advance `loadedPage`, skipping the new list's page 2.
  const generationRef = useRef(0)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const readMeta = useCallback(
    (response: PagedResponse<T>) => {
      setHasMore(response.meta.hasMore ?? false)
      setTotalCount(response.meta[countField] ?? null)
    },
    [countField],
  )

  const resetFromFirstPage = useCallback(
    (response: PagedResponse<T>) => {
      generationRef.current += 1
      setLoadedPage(1)
      setIsLoadingMore(false)
      setLoadMoreError(null)
      readMeta(response)
    },
    [readMeta],
  )

  // Refreshes `hasMore`/the total from a re-fetched first page (e.g. a background poll) without
  // discarding the pages already loaded.
  const refreshMetaFromFirstPage = useCallback(
    (response: PagedResponse<T>) => {
      const total = response.meta[countField]
      const limit = response.meta.limit

      if (loadedPageRef.current === 1) {
        setHasMore(response.meta.hasMore ?? false)
      } else if (total != null && limit != null) {
        setHasMore(loadedPageRef.current * limit < total)
      }
      setTotalCount(total ?? null)
    },
    [countField],
  )

  async function loadMore() {
    const generation = generationRef.current
    const nextPage = loadedPage + 1
    setIsLoadingMore(true)
    setLoadMoreError(null)

    try {
      const response = await fetchPageRef.current(nextPage)

      if (!isMountedRef.current || generation !== generationRef.current) {
        return
      }

      setItems((currentItems) => appendUniqueBy(currentItems, response.items, getKey))
      setLoadedPage(nextPage)
      readMeta(response)
    } catch (error) {
      if (isMountedRef.current && generation === generationRef.current) {
        setLoadMoreError(getApiErrorMessage(error, errorMessage))
      }
    } finally {
      if (isMountedRef.current && generation === generationRef.current) {
        setIsLoadingMore(false)
      }
    }
  }

  return {
    hasMore,
    totalCount,
    isLoadingMore,
    loadMoreError,
    loadMore,
    resetFromFirstPage,
    refreshMetaFromFirstPage,
  }
}
