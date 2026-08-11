import { useState } from 'react'

import { StatusPill } from '@/components/StatusPill'
import { QuantityControl } from '@/components/cart/QuantityControl'
import { VariantPickerModal } from '@/components/shop/VariantPickerModal'
import type { PublicCatalogProduct, PublicCatalogVariant } from '@/types/api'
import { formatCurrency } from '@/utils/formatCurrency'

interface ProductCardProps {
  product: PublicCatalogProduct
  quantityInCart: number
  onAddToCart: () => void
  onIncreaseQty: () => void
  onDecreaseQty: () => void
  onUpdateQty: (quantity: number) => void
  /**
   * Only needed for products with 2+ variants (`hasVariants && variantCount > 1`) — powers the
   * "Select options" flow. Single-variant products never read these, so callers rendering only
   * single-variant products can omit them entirely.
   */
  variantQuantities?: Record<string, number>
  onAddVariant?: (variant: PublicCatalogVariant) => void
  onIncreaseVariant?: (variant: PublicCatalogVariant) => void
  onDecreaseVariant?: (variant: PublicCatalogVariant) => void
  onUpdateVariantQty?: (variant: PublicCatalogVariant, quantity: number) => void
  /**
   * True whenever the shop isn't accepting orders right now (its
   * `todayStatus !== 'OPEN'`) — hides quantity controls and the variant
   * picker in favor of a single disabled button, regardless of stock.
   */
  orderingDisabled?: boolean
  /** Shown on the disabled button when `orderingDisabled` is true, e.g. "Closed today". */
  orderingDisabledLabel?: string
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
  variantQuantities,
  onAddVariant,
  onIncreaseVariant,
  onDecreaseVariant,
  onUpdateVariantQty,
  orderingDisabled = false,
  orderingDisabledLabel = 'Unavailable',
}: ProductCardProps) {
  const [isVariantPickerOpen, setIsVariantPickerOpen] = useState(false)
  const showMrp = (product.mrp ?? 0) > product.price
  const isOutOfStock = product.stockStatus === 'OUT_OF_STOCK'
  const hasMultipleVariants = product.hasVariants && product.variantCount > 1

  return (
    <article className="flex h-full flex-col rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-[0_20px_70px_-45px_rgba(28,20,10,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_70px_-40px_rgba(28,20,10,0.5)]">
      <div className="mb-4 overflow-hidden rounded-[1.35rem] bg-nearkart-50">
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
          {orderingDisabled ? (
            <button
              className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400"
              disabled
              type="button"
            >
              {orderingDisabledLabel}
            </button>
          ) : hasMultipleVariants ? (
            <>
              <button
                className="inline-flex w-full items-center justify-center rounded-full bg-nearkart-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-nearkart-700"
                onClick={() => setIsVariantPickerOpen(true)}
                type="button"
              >
                Select options
              </button>
              <VariantPickerModal
                isOpen={isVariantPickerOpen}
                onAdd={(variant) => onAddVariant?.(variant)}
                onClose={() => setIsVariantPickerOpen(false)}
                onDecrease={(variant) => onDecreaseVariant?.(variant)}
                onIncrease={(variant) => onIncreaseVariant?.(variant)}
                onUpdateQty={(variant, quantity) => onUpdateVariantQty?.(variant, quantity)}
                product={product}
                variantQuantities={variantQuantities ?? {}}
              />
            </>
          ) : quantityInCart > 0 ? (
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
              className="inline-flex w-full items-center justify-center rounded-full bg-nearkart-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-nearkart-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
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
