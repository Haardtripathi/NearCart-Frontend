import { QuantityControl } from '@/components/cart/QuantityControl'
import type { CartItem } from '@/types/cart'
import { formatCurrency } from '@/utils/formatCurrency'

interface CartItemCardProps {
  item: CartItem
  onDecrease: () => void
  onIncrease: () => void
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

export function CartItemCard({
  item,
  onDecrease,
  onIncrease,
  onQuantityChange,
  onRemove,
}: CartItemCardProps) {
  const showMrp = (item.mrp ?? 0) > item.price

  return (
    <article className="flex flex-col gap-4 rounded-[1.5rem] border border-ink-100 bg-white p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)] sm:flex-row sm:items-center sm:p-5">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[1.25rem] bg-nearkart-50">
        {item.image ? (
          <img
            alt={item.name}
            className="h-full w-full object-cover"
            src={item.image}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.24em] text-ink-400">
            No image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold text-ink-900">{item.name}</h2>
          <p className="text-sm text-ink-500">
            {[item.brand, item.unitLabel].filter(Boolean).join(' • ')}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="text-base font-bold text-ink-900">
            {formatCurrency(item.price)}
          </div>
          {showMrp ? (
            <div className="text-sm text-ink-400 line-through">
              {formatCurrency(item.mrp ?? 0)}
            </div>
          ) : null}
          <div className="text-sm text-ink-500">
            Item total <span className="font-semibold text-ink-700">{formatCurrency(item.price * item.quantity)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <QuantityControl
            max={item.stockQty}
            onChange={onQuantityChange}
            onDecrease={onDecrease}
            onIncrease={onIncrease}
            quantity={item.quantity}
          />

          <button
            className="rounded-full border border-accent-200 px-4 py-2 text-sm font-semibold text-accent-600 transition hover:bg-accent-50"
            onClick={onRemove}
            type="button"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  )
}
