interface LoadMoreButtonProps {
  isLoading: boolean
  onClick: () => void
  label?: string
  // Optional "Showing X of N" line above the button, so a paged list never looks complete when
  // it isn't.
  shownCount?: number
  totalCount?: number | null
  // Shown under the button when the last "Load more" failed — kept separate from a page's main
  // error banner so a failed extra page never hides the rows already loaded.
  errorMessage?: string | null
}

/**
 * The "Load more" control for server-paged lists (shops, orders, admin tables, shop catalog).
 * Same look as `ShopReviewsSection`'s "Load more reviews" button.
 */
export function LoadMoreButton({
  isLoading,
  onClick,
  label = 'Load more',
  shownCount,
  totalCount,
  errorMessage,
}: LoadMoreButtonProps) {
  return (
    <div className="flex flex-col items-center gap-3 pt-2">
      {shownCount != null && totalCount != null ? (
        <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
          Showing {shownCount} of {totalCount}
        </p>
      ) : null}
      <button
        className="flex h-11 items-center justify-center rounded-xl border border-ink-100 bg-white px-8 text-sm font-bold text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
        onClick={onClick}
        type="button"
      >
        {isLoading ? 'Loading…' : label}
      </button>
      {errorMessage ? <p className="text-xs font-medium text-accent-700">{errorMessage}</p> : null}
    </div>
  )
}
