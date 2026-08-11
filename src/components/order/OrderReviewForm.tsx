import { useState } from 'react'

import { submitOrderReview } from '@/api/orders'
import { StarRating } from '@/components/StarRating'
import type { Order, OrderReviewSummary } from '@/types/order'
import { getApiErrorMessage } from '@/utils/api'
import { formatDateTime } from '@/utils/formatDateTime'

interface OrderReviewFormProps {
  order: Order
  onReviewSubmitted: (review: OrderReviewSummary) => void
}

const STAR_VALUES = [1, 2, 3, 4, 5]

/**
 * "Rate your order" prompt shown on the order-detail page once an order is
 * `DELIVERED` and has no review yet (see `OrderDetailsPage.tsx`). Renders the
 * submitted review in place of the form on success — `order.review` already
 * covers the case where a review exists on page load, so this component
 * only ever needs to handle the empty->submitted transition within one
 * session.
 */
export function OrderReviewForm({ order, onReviewSubmitted }: OrderReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit() {
    if (rating < 1) {
      setErrorMessage('Please select a star rating.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await submitOrderReview(order.id, {
        rating,
        comment: comment.trim() || undefined,
      })

      onReviewSubmitted(response.item)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Unable to submit your review right now.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayedRating = hoverRating || rating

  return (
    <div className="rounded-[2rem] border border-ink-100 bg-white p-8 shadow-[var(--shadow-card)]">
      <h3 className="font-display text-xl font-bold text-ink-900">Rate your order</h3>
      <p className="mt-1 text-sm text-ink-400">
        How was your experience with {order.shopName}?
      </p>

      <div className="mt-6 flex items-center gap-1 text-3xl">
        {STAR_VALUES.map((starValue) => (
          <button
            aria-label={`Rate ${starValue} star${starValue === 1 ? '' : 's'}`}
            className={`transition ${starValue <= displayedRating ? 'text-sun-500' : 'text-ink-200'} hover:scale-110 active:scale-95`}
            key={starValue}
            onClick={() => setRating(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            type="button"
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        className="field-input mt-6 min-h-24 resize-y"
        onChange={(event) => setComment(event.target.value)}
        placeholder="Tell other customers about your experience (optional)"
        rows={3}
        value={comment}
      />

      {errorMessage ? (
        <p className="mt-3 text-sm font-medium text-accent-600">{errorMessage}</p>
      ) : null}

      <button
        className="btn-primary mt-6 h-12 w-full sm:w-auto sm:px-8"
        disabled={isSubmitting}
        onClick={() => void handleSubmit()}
        type="button"
      >
        {isSubmitting ? 'Submitting…' : 'Submit review'}
      </button>
    </div>
  )
}

interface SubmittedOrderReviewProps {
  review: OrderReviewSummary
}

export function SubmittedOrderReview({ review }: SubmittedOrderReviewProps) {
  return (
    <div className="rounded-[2rem] border border-ink-100 bg-white p-8 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold text-ink-900">Your review</h3>
        <StarRating value={review.rating} />
      </div>
      {review.comment ? (
        <p className="mt-4 text-sm leading-relaxed text-ink-600">"{review.comment}"</p>
      ) : (
        <p className="mt-4 text-sm italic text-ink-400">No written comment.</p>
      )}
      <p className="mt-4 text-xs font-medium text-ink-400">
        Submitted on {formatDateTime(review.createdAt)}
      </p>
    </div>
  )
}
