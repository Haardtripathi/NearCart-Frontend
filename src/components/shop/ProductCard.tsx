import { StatusPill } from '@/components/StatusPill'
import { QuantityControl } from '@/components/cart/QuantityControl'
import type { PublicCatalogProduct } from '@/types/api'
import { formatCurrency } from '@/utils/formatCurrency'

interface ProductCardProps {
  product: PublicCatalogProduct
  quantityInCart: number
  onAddToCart: () => void
  onIncreaseQty: () => void
  onDecreaseQty: () => void
  onUpdateQty: (quantity: number) => void
}

const stockToneByStatus = {
  IN_STOCK: 'success',
  LOW_STOCK: 'warning',
  OUT_OF_STOCK: 'danger',
} as const

export function ProductCard({
  product,
  quantityInCart,
  onAddToCart,
  onIncreaseQty,
  onDecreaseQty,
  onUpdateQty,
}: ProductCardProps) {
  const showMrp = (product.mrp ?? 0) > product.price
  const isOutOfStock = product.stockStatus === 'OUT_OF_STOCK'

  return (
    <article className="flex h-full flex-col rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.5)]">
      <div className="mb-4 overflow-hidden rounded-[1.35rem] bg-nearcart-50">
        {product.image ? (
          <img
            alt={product.name}
            className="h-44 w-full object-cover"
            src={product.image}
          />
        ) : (
          <div className="flex h-44 items-center justify-center text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-ink-900">
              {product.name}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {[product.brand?.name, product.unitLabel].filter(Boolean).join(' • ')}
            </p>
          </div>
          <StatusPill
            label={product.stockStatus.replaceAll('_', ' ')}
            tone={stockToneByStatus[product.stockStatus]}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div className="text-xl font-semibold text-ink-900">
            {formatCurrency(product.price)}
          </div>
          {showMrp ? (
            <div className="text-sm text-slate-400 line-through">
              {formatCurrency(product.mrp ?? 0)}
            </div>
          ) : null}
          {!isOutOfStock ? (
            <div className="text-sm text-slate-500">
              {product.availableQty} left
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          {quantityInCart > 0 ? (
            <div className="space-y-3">
              <QuantityControl
                max={product.availableQty}
                onChange={onUpdateQty}
                onDecrease={onDecreaseQty}
                onIncrease={onIncreaseQty}
                quantity={quantityInCart}
              />
              <p className="text-sm text-slate-500">
                {quantityInCart} in cart
              </p>
            </div>
          ) : (
            <button
              className="inline-flex w-full items-center justify-center rounded-full bg-nearcart-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-nearcart-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              disabled={isOutOfStock}
              onClick={onAddToCart}
              type="button"
            >
              {isOutOfStock ? 'Out of stock' : 'Add to cart'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
