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
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-[0_12px_30px_-24px_rgba(17,33,23,0.8)] ${className}`.trim()}
    >
      <button
        aria-label="Decrease quantity"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg font-semibold text-slate-700 transition hover:border-nearcart-200 hover:text-nearcart-700 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={quantity <= 1}
        onClick={onDecrease}
        type="button"
      >
        -
      </button>

      <input
        aria-label="Quantity"
        className="w-14 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold text-slate-800 outline-none transition focus:border-nearcart-400"
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
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg font-semibold text-slate-700 transition hover:border-nearcart-200 hover:text-nearcart-700 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={max != null ? quantity >= max : false}
        onClick={onIncrease}
        type="button"
      >
        +
      </button>
    </div>
  )
}
