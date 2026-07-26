import { useEffect } from 'react'

import { QuantityControl } from '@/components/cart/QuantityControl'
import { StatusPill } from '@/components/StatusPill'
import type { PublicCatalogProduct, PublicCatalogVariant } from '@/types/api'
import { formatCurrency } from '@/utils/formatCurrency'

interface VariantPickerModalProps {
  product: PublicCatalogProduct
  isOpen: boolean
  onClose: () => void
  /** variantId -> quantity currently in cart, so the modal can show per-variant state. */
  variantQuantities: Record<string, number>
  onAdd: (variant: PublicCatalogVariant) => void
  onIncrease: (variant: PublicCatalogVariant) => void
  onDecrease: (variant: PublicCatalogVariant) => void
  onUpdateQty: (variant: PublicCatalogVariant, quantity: number) => void
}

const stockToneByStatus = {
  IN_STOCK: 'success',
  LOW_STOCK: 'warning',
  OUT_OF_STOCK: 'danger',
} as const

/**
 * Plain overlay `<div>` — this app has no dialog/modal library, so this is hand-rolled to match
 * the existing no-UI-kit convention. Shown when a product has 2+ variants; each row reuses the
 * same `QuantityControl` the single-variant `ProductCard` path already uses.
 */
export function VariantPickerModal({
  product,
  isOpen,
  onClose,
  variantQuantities,
  onAdd,
  onIncrease,
  onDecrease,
  onUpdateQty,
}: VariantPickerModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-glass-strong sm:rounded-[2rem] sm:p-8"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Choose an option for ${product.name}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-nearkart-600">
              Select options
            </p>
            <h3 className="mt-1 font-display text-2xl font-bold text-ink-900">
              {product.name}
            </h3>
          </div>
          <button
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-100 text-lg font-semibold text-ink-500 transition hover:bg-ink-50"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {product.variants.map((variant) => {
            const quantityInCart = variantQuantities[variant.id] ?? 0
            const isOutOfStock = variant.stock.stockStatus === 'OUT_OF_STOCK'
            const showMrp = (variant.mrp ?? 0) > variant.price

            return (
              <div
                key={variant.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-ink-50/30 p-4"
              >
                <div className="min-w-[140px] flex-1">
                  <p className="font-bold text-ink-900">
                    {variant.name}
                    {variant.unitLabel ? (
                      <span className="ml-1 font-normal text-ink-400">
                        · {variant.unitLabel}
                      </span>
                    ) : null}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink-900">
                      {formatCurrency(variant.price)}
                    </span>
                    {showMrp ? (
                      <span className="text-xs text-ink-400 line-through">
                        {formatCurrency(variant.mrp ?? 0)}
                      </span>
                    ) : null}
                    <StatusPill
                      label={variant.stock.stockStatus.replaceAll('_', ' ')}
                      tone={stockToneByStatus[variant.stock.stockStatus]}
                    />
                  </div>
                </div>

                {quantityInCart > 0 ? (
                  <QuantityControl
                    max={variant.stock.availableQty}
                    onChange={(quantity) => onUpdateQty(variant, quantity)}
                    onDecrease={() => onDecrease(variant)}
                    onIncrease={() => onIncrease(variant)}
                    quantity={quantityInCart}
                  />
                ) : (
                  <button
                    className="inline-flex h-10 items-center justify-center rounded-full bg-nearkart-600 px-5 text-sm font-semibold text-white transition hover:bg-nearkart-700 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400"
                    disabled={isOutOfStock}
                    onClick={() => onAdd(variant)}
                    type="button"
                  >
                    {isOutOfStock ? 'Out of stock' : 'Add'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
