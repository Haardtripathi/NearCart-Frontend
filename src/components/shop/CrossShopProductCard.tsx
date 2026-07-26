import { useState } from 'react'
import { Link } from 'react-router-dom'

import { StatusPill } from '@/components/StatusPill'
import { QuantityControl } from '@/components/cart/QuantityControl'
import { VariantPickerModal } from '@/components/shop/VariantPickerModal'
import { useCartStore } from '@/store/cartStore'
import type {
  PublicCatalogVariant,
  PublicSearchResultItem,
  PublicShopSummary,
} from '@/types/api'
import type { CartItem } from '@/types/cart'
import { formatCurrency } from '@/utils/formatCurrency'

interface CrossShopProductCardProps {
  product: PublicSearchResultItem
}

const stockToneByStatus = {
  IN_STOCK: 'success',
  LOW_STOCK: 'warning',
  OUT_OF_STOCK: 'danger',
} as const

/**
 * Cart-item builder mirrors the pattern in `ShopDetailsPage.createCartItem`, adapted for a
 * `PublicShopSummary` (search/trending results embed the lighter shop summary, not the full
 * shop-detail shape).
 */
function createCartItem(
  shop: PublicShopSummary,
  product: PublicSearchResultItem,
  variant?: PublicCatalogVariant,
): CartItem {
  const variantId = variant?.id ?? product.variantId

  return {
    cartItemId: `${product.id}:${variantId}`,
    productId: product.id,
    variantId,
    shopId: shop.id,
    shopName: shop.name,
    name: variant && !variant.isDefault ? `${product.name} (${variant.name})` : product.name,
    description: product.description,
    brand: product.brand?.name ?? null,
    category: product.category?.name ?? null,
    unitLabel: variant?.unitLabel ?? product.unitLabel,
    image: variant?.imageUrl ?? product.image,
    price: variant?.price ?? product.price,
    mrp: variant?.mrp ?? product.mrp,
    stockQty: variant?.stock.availableQty ?? product.availableQty,
    stockStatus: variant?.stock.stockStatus ?? product.stockStatus,
    quantity: 1,
  }
}

/**
 * Product card variant used on cross-shop surfaces (home trending rail, search results) — same
 * visual language as `ProductCard`, but also shows/links the product's shop, since these items
 * are pulled from many shops at once.
 */
export function CrossShopProductCard({ product }: CrossShopProductCardProps) {
  const [isVariantPickerOpen, setIsVariantPickerOpen] = useState(false)
  const { items, addItem, increaseQty, decreaseQty, updateQty } = useCartStore(
    (state) => state,
  )

  const showMrp = (product.mrp ?? 0) > product.price
  const isOutOfStock = product.stockStatus === 'OUT_OF_STOCK'
  const hasMultipleVariants = product.hasVariants && product.variantCount > 1

  const productCartItems = items.filter((item) => item.productId === product.id)
  const defaultCartItem = productCartItems.find(
    (item) => item.variantId === product.variantId,
  )
  const variantQuantities = Object.fromEntries(
    productCartItems
      .filter((item) => item.variantId)
      .map((item) => [item.variantId as string, item.quantity]),
  )

  function addCartItem(cartItem: CartItem) {
    const result = addItem(cartItem)

    if (!result.requiresConfirmation) {
      return
    }

    const didConfirm = window.confirm(
      `Your cart already contains items from ${result.conflictShopName ?? 'another shop'}. Clear that cart and add this item instead?`,
    )

    if (didConfirm) {
      addItem(cartItem, { forceReplace: true })
    }
  }

  return (
    <article className="flex h-full w-full flex-col rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-[0_20px_70px_-45px_rgba(76,29,149,0.5)]">
      <Link className="mb-4 block overflow-hidden rounded-[1.35rem] bg-nearkart-50" to={`/shops/${product.shop.slug}`}>
        {product.image ? (
          <img
            alt={product.name}
            className="h-36 w-full object-cover"
            src={product.image}
          />
        ) : (
          <div className="flex h-36 items-center justify-center text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            No image
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <Link
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-nearkart-600 hover:underline"
          to={`/shops/${product.shop.slug}`}
        >
          {product.shop.name}
        </Link>

        <div className="mt-1 flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-tight text-ink-900 line-clamp-2">
            {product.name}
          </h3>
          <StatusPill
            label={product.stockStatus.replaceAll('_', ' ')}
            tone={stockToneByStatus[product.stockStatus]}
          />
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {[product.brand?.name, product.unitLabel].filter(Boolean).join(' • ')}
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="text-lg font-semibold text-ink-900">
            {formatCurrency(product.price)}
          </div>
          {showMrp ? (
            <div className="text-xs text-slate-400 line-through">
              {formatCurrency(product.mrp ?? 0)}
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          {hasMultipleVariants ? (
            <>
              <button
                className="inline-flex w-full items-center justify-center rounded-full bg-nearkart-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-nearkart-700"
                onClick={() => setIsVariantPickerOpen(true)}
                type="button"
              >
                Select options
              </button>
              <VariantPickerModal
                isOpen={isVariantPickerOpen}
                onAdd={(variant) => addCartItem(createCartItem(product.shop, product, variant))}
                onClose={() => setIsVariantPickerOpen(false)}
                onDecrease={(variant) => decreaseQty(`${product.id}:${variant.id}`)}
                onIncrease={(variant) => increaseQty(`${product.id}:${variant.id}`)}
                onUpdateQty={(variant, quantity) =>
                  updateQty(`${product.id}:${variant.id}`, quantity)
                }
                product={product}
                variantQuantities={variantQuantities}
              />
            </>
          ) : (defaultCartItem?.quantity ?? 0) > 0 ? (
            <QuantityControl
              max={product.availableQty}
              onChange={(quantity) =>
                defaultCartItem && updateQty(defaultCartItem.cartItemId, quantity)
              }
              onDecrease={() => defaultCartItem && decreaseQty(defaultCartItem.cartItemId)}
              onIncrease={() => defaultCartItem && increaseQty(defaultCartItem.cartItemId)}
              quantity={defaultCartItem?.quantity ?? 0}
            />
          ) : (
            <button
              className="inline-flex w-full items-center justify-center rounded-full bg-nearkart-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-nearkart-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              disabled={isOutOfStock}
              onClick={() => addCartItem(createCartItem(product.shop, product))}
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
