interface QuantityControlProps {
  quantity: number
  onDecrease: () => void
  onIncrease: () => void
  onChange: (quantity: number) => void
  max?: number | null
  className?: string
}

export function QuantityControl({
  quantity,
  onDecrease,
  onIncrease,
  onChange,
  max,
  className = '',
}: QuantityControlProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-nearkart-200 bg-nearkart-50/60 px-2 py-2 ${className}`.trim()}
    >
      <button
        aria-label="Decrease quantity"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-nearkart-700 shadow-sm transition hover:bg-nearkart-600 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-nearkart-700"
        disabled={quantity <= 1}
        onClick={onDecrease}
        type="button"
      >
        -
      </button>

      <input
        aria-label="Quantity"
        className="w-12 rounded-xl border-none bg-transparent px-1 py-2 text-center text-sm font-bold text-ink-900 outline-none"
        max={max ?? undefined}
        min={1}
        onChange={(event) => {
          const nextValue = Number.parseInt(event.target.value, 10)

          onChange(Number.isNaN(nextValue) ? 1 : nextValue)
        }}
        type="number"
        value={quantity}
      />

      <button
        aria-label="Increase quantity"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-nearkart-700 shadow-sm transition hover:bg-nearkart-600 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-nearkart-700"
        disabled={max != null ? quantity >= max : false}
        onClick={onIncrease}
        type="button"
      >
        +
      </button>
    </div>
  )
}
