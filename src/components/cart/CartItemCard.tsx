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
    <article className="flex flex-col gap-4 rounded-[1.5rem] border border-white/80 bg-white/95 p-4 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.55)] sm:flex-row sm:items-center sm:p-5">
      <div className="h-24 w-24 overflow-hidden rounded-[1.25rem] bg-nearkart-50">
        {item.image ? (
          <img
            alt={item.name}
            className="h-full w-full object-cover"
            src={item.image}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            No image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-1">
          <h2 className="font-display text-xl text-ink-900">{item.name}</h2>
          <p className="text-sm text-slate-600">
            {[item.brand, item.unitLabel].filter(Boolean).join(' • ')}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="text-base font-semibold text-ink-900">
            {formatCurrency(item.price)}
          </div>
          {showMrp ? (
            <div className="text-sm text-slate-400 line-through">
              {formatCurrency(item.mrp ?? 0)}
            </div>
          ) : null}
          <div className="text-sm text-slate-500">
            Item total {formatCurrency(item.price * item.quantity)}
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
            className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
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
