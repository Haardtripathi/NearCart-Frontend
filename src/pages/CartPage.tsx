import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { CartItemCard } from '@/components/cart/CartItemCard'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/utils/formatCurrency'

export function CartPage() {
  const {
    shopId,
    shopName,
    items,
    increaseQty,
    decreaseQty,
    updateQty,
    removeItem,
    clearCart,
    getCartCount,
    getCartSubtotal,
  } = useCartStore((state) => state)

  const cartCount = getCartCount()
  const subtotal = getCartSubtotal()
  const hasItems = items.length > 0

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Cart"
        title={hasItems ? 'Review your cart' : 'Your cart is empty'}
        description={
          hasItems
            ? 'Adjust quantities, remove items, and keep shopping from the same store before you place the order.'
            : 'Start from a shop, add a few products, and they will be waiting here when you come back.'
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.85fr]">
        <div className="space-y-4">
          {hasItems ? (
            <>
              <article className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
                      Current shop
                    </p>
                    <h2 className="mt-2 font-display text-2xl text-ink-900">
                      {shopName}
                    </h2>
                  </div>
                  <Link
                    className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-nearcart-200 hover:text-nearcart-700"
                    to={shopId ? `/shops/${shopId}` : '/shops'}
                  >
                    Continue shopping
                  </Link>
                </div>
              </article>

              {items.map((item) => (
                <CartItemCard
                  key={item.storeProductId}
                  item={item}
                  onDecrease={() => decreaseQty(item.storeProductId)}
                  onIncrease={() => increaseQty(item.storeProductId)}
                  onQuantityChange={(quantity) =>
                    updateQty(item.storeProductId, quantity)
                  }
                  onRemove={() => removeItem(item.storeProductId)}
                />
              ))}
            </>
          ) : (
            <article className="rounded-[1.75rem] border border-white/80 bg-white/90 p-8 text-center shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
              <h2 className="font-display text-3xl text-ink-900">
                No items added yet
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Browse a shop, add products that are in stock, and come back
                here to manage quantities.
              </p>
              <Link
                className="mt-6 inline-flex rounded-full bg-nearcart-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-nearcart-700"
                to="/shops"
              >
                Explore shops
              </Link>
            </article>
          )}
        </div>

        <aside className="space-y-4">
          <article className="rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
              Order summary
            </p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Total quantity</span>
                <span className="font-semibold text-slate-800">{cartCount}</span>
              </div>
              <div className="flex items-center justify-between text-base text-slate-700">
                <span>Subtotal</span>
                <span className="font-semibold text-nearcart-700">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>

            <Link
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-nearcart-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-nearcart-700"
              to={hasItems ? '/checkout' : '/cart'}
            >
              Proceed to checkout
            </Link>

            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-nearcart-200 hover:text-nearcart-700"
                to={shopId ? `/shops/${shopId}` : '/shops'}
              >
                Continue shopping
              </Link>
              <button
                className="inline-flex rounded-full border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!hasItems}
                onClick={clearCart}
                type="button"
              >
                Clear cart
              </button>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
              Helpful details
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <li>Your cart stays tied to one shop at a time.</li>
              <li>Quantity controls respect the available stock shown for each item.</li>
              <li>You can head to checkout as soon as your cart looks right.</li>
            </ul>
          </article>
        </aside>
      </section>
    </div>
  )
}
