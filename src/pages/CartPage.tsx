import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/PageHeader'
import { CartItemCard } from '@/components/cart/CartItemCard'
import { StaggerGrid, StaggerItem } from '@/components/shared/StaggerGrid'
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
    <div className="space-y-12">
      <PageHeader
        eyebrow="My Cart"
        title={hasItems ? 'Review your cart' : 'Your cart is empty'}
        description={
          hasItems
            ? `Items from ${shopName} are ready for checkout.`
            : 'Explore nearby shops to add items to your cart.'
        }
      />

      {!hasItems ? (
        <div className="flex min-h-[450px] items-center justify-center rounded-[3rem] border border-dashed border-ink-200 bg-ink-50/50 p-8 sm:p-12">
          <div className="mx-auto flex max-w-sm flex-col items-center text-center">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white text-5xl shadow-sm">
              🛒
            </div>
            <h3 className="font-display text-2xl font-bold text-ink-900">Your cart is feeling light</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              Start adding fresh products from our local partner shops to see them here.
            </p>
            <div className="mt-10">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-xl bg-ink-900 px-8 text-sm font-bold text-white transition hover:shadow-lg active:scale-95"
                to="/shops"
              >
                Go Shopping
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-12 lg:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-nearkart-50 flex items-center justify-center text-xl">
                  🏢
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-nearkart-600">Shopping at</p>
                  <h3 className="font-bold text-ink-900">{shopName}</h3>
                </div>
              </div>
              <Link
                className="text-xs font-bold text-nearkart-600 underline underline-offset-4 transition hover:text-nearkart-700"
                to={shopId ? `/shops/${shopId}` : '/shops'}
              >
                Change Shop
              </Link>
            </div>

            <StaggerGrid className="space-y-4">
              {items.map((item) => (
                <StaggerItem key={item.cartItemId}>
                  <CartItemCard
                    item={item}
                    onDecrease={() => decreaseQty(item.cartItemId)}
                    onIncrease={() => increaseQty(item.cartItemId)}
                    onQuantityChange={(quantity) =>
                      updateQty(item.cartItemId, quantity)
                    }
                    onRemove={() => removeItem(item.cartItemId)}
                  />
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>

          <aside className="relative">
            <div className="sticky top-28 space-y-6">
              <article className="overflow-hidden rounded-[2.5rem] border border-ink-100 bg-white shadow-glass">
                <div className="border-b border-ink-50 bg-ink-50/30 px-8 py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-nearkart-600">
                    Summary
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-ink-900">
                    Order Total
                  </h2>
                </div>

                <div className="space-y-6 p-8">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-400">Total Items</span>
                      <span className="font-bold text-ink-900">{cartCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-400">Subtotal</span>
                      <span className="font-bold text-ink-900">{formatCurrency(subtotal)}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-ink-900 p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">Payable Now</span>
                      <span className="text-xl font-bold">{formatCurrency(subtotal)}</span>
                    </div>
                    <p className="mt-3 text-[10px] font-medium opacity-60 leading-relaxed">
                      Final taxes and delivery charges may apply at the next step based on your address.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Link className="btn-primary h-12 w-full" to="/checkout">
                      Proceed to Checkout →
                    </Link>
                    <button
                      className="text-xs font-bold text-accent-600 transition hover:text-accent-700"
                      onClick={clearCart}
                    >
                      Clear entire cart
                    </button>
                  </div>
                </div>
              </article>

              <div className="rounded-2xl border border-ink-100 bg-ink-50/50 p-4">
                <div className="flex gap-3">
                  <span className="text-xl">💳</span>
                  <p className="text-[10px] font-medium leading-relaxed text-ink-400">
                    Safe and secure payments powered by Razorpay. Your data is always encrypted and protected.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
