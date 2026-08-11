import { useEffect, useState } from 'react'

import { getShopReviews } from '@/api/shops'
import { StarRating } from '@/components/StarRating'
import type { PublicShopReview } from '@/types/api'
import { getApiErrorMessage } from '@/utils/api'
import { formatDateTime } from '@/utils/formatDateTime'

interface ShopReviewsSectionProps {
  shopId: string
}

const PAGE_LIMIT = 10

/**
 * Reviews list for a shop's storefront page — paginated via a simple "Load
 * more" button rather than infinite scroll/full pagination controls; the
 * per-shop review volume at this scale doesn't warrant more.
 */
export function ShopReviewsSection({ shopId }: ShopReviewsSectionProps) {
  const [reviews, setReviews] = useState<PublicShopReview[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [reviewCount, setReviewCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadFirstPage() {
      setIsLoading(true)

      try {
        const response = await getShopReviews(shopId, { page: 1, limit: PAGE_LIMIT })

        if (!isMounted) {
          return
        }

        setReviews(response.items)
        setPage(1)
        setTotalPages(response.meta.totalPages)
        setReviewCount(response.meta.reviewCount)
        setErrorMessage(null)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(getApiErrorMessage(error, 'Unable to load reviews right now.'))
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadFirstPage()

    return () => {
      isMounted = false
    }
  }, [shopId])

  async function handleLoadMore() {
    const nextPage = page + 1

    setIsLoadingMore(true)

    try {
      const response = await getShopReviews(shopId, { page: nextPage, limit: PAGE_LIMIT })
      setReviews((currentReviews) => [...currentReviews, ...response.items])
      setPage(nextPage)
      setTotalPages(response.meta.totalPages)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Unable to load more reviews right now.'))
    } finally {
      setIsLoadingMore(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="h-24 animate-pulse rounded-3xl bg-ink-50" key={`review-skeleton-${index}`} />
        ))}
      </div>
    )
  }

  if (errorMessage && reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-accent-100 bg-accent-50/60 p-4 text-sm text-accent-700">
        {errorMessage}
      </p>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-ink-100 bg-white/50 p-12 text-center">
        <div className="mb-4 text-3xl">⭐</div>
        <h3 className="font-display text-lg font-bold text-ink-900">No reviews yet</h3>
        <p className="mt-1 text-sm text-ink-400">Be the first to rate an order from this shop.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
        {reviewCount} review{reviewCount === 1 ? '' : 's'}
      </p>

      {reviews.map((review) => (
        <article className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm" key={review.id}>
          <div className="flex items-center justify-between">
            <p className="font-bold text-ink-900">{review.reviewerName}</p>
            <StarRating size="sm" value={review.rating} />
          </div>
          {review.comment ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{review.comment}</p>
          ) : null}
          <p className="mt-3 text-xs font-medium text-ink-400">{formatDateTime(review.createdAt)}</p>
        </article>
      ))}

      {page < totalPages ? (
        <button
          className="mx-auto flex h-11 items-center justify-center rounded-xl border border-ink-100 bg-white px-8 text-sm font-bold text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoadingMore}
          onClick={() => void handleLoadMore()}
          type="button"
        >
          {isLoadingMore ? 'Loading…' : 'Load more reviews'}
        </button>
      ) : null}
    </div>
  )
}
