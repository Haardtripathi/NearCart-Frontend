interface StarRatingProps {
  value: number
  size?: 'sm' | 'md'
}

const SIZE_CLASSES: Record<NonNullable<StarRatingProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-lg',
}

/**
 * Read-only 5-star display, rounded to the nearest whole star (ratings are
 * always integers 1-5 at the data layer — see `OrderReview.rating` — so no
 * half-star rendering is needed).
 */
export function StarRating({ value, size = 'md' }: StarRatingProps) {
  const roundedValue = Math.round(Math.min(5, Math.max(0, value)))

  return (
    <span className={`inline-flex items-center gap-0.5 ${SIZE_CLASSES[size]}`} role="img" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          className={index < roundedValue ? 'text-sun-500' : 'text-ink-200'}
          key={index}
        >
          ★
        </span>
      ))}
    </span>
  )
}
