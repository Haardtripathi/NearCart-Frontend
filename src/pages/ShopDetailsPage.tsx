import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getShopDetails } from '@/api/shops'
import { PageHeader } from '@/components/PageHeader'
import { ProductCard } from '@/components/shop/ProductCard'
import type { StoreProduct, ShopDetails } from '@/types/api'
import type { CartItem } from '@/types/cart'
import { formatCurrency } from '@/utils/formatCurrency'
import { useCartStore } from '@/store/cartStore'

export function ShopDetailsPage() {
  const { shopId = 'sample-shop' } = useParams()
  const [shop, setShop] = useState<ShopDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const {
    shopId: cartShopId,
    shopName: cartShopName,
    items,
    addItem,
    increaseQty,
    decreaseQty,
    updateQty,
    getCartCount,
    getCartSubtotal,
  } = useCartStore((state) => state)

  useEffect(() => {
    let isMounted = true

    async function loadShop() {
      try {
        const response = await getShopDetails(shopId)

        if (!isMounted) {
          return
        }

        setShop(response.item)
        setErrorMessage(null)
      } catch {
        if (!isMounted) {
          return
        }

        setErrorMessage('Unable to load shop details right now.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadShop()

    return () => {
      isMounted = false
    }
  }, [shopId])

  function createCartItem(product: StoreProduct): CartItem | null {
    if (!shop) {
      return null
    }

    return {
      storeProductId: product.storeProductId,
      shopId: shop.id,
      shopName: shop.name,
      name: product.name,
      brand: product.brand,
      size: product.size,
      image: product.image,
      price: product.price,
      mrp: product.mrp,
      stockQty: product.stockQty,
      stockStatus: product.stockStatus,
      quantity: 1,
    }
  }

  function handleAddToCart(product: StoreProduct) {
    const cartItem = createCartItem(product)

    if (!cartItem) {
      return
    }

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

  const cartCount = getCartCount()
  const cartSubtotal = getCartSubtotal()

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Shop details"
        title={shop ? shop.name : 'Shop details'}
        description={
          shop
            ? `Browse products from ${shop.name}, add what you need, and keep your cart focused on one shop at a time.`
            : 'Loading shop details.'
        }
      />

      {errorMessage ? (
        <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-4">
          {shop ? (
            <article className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
                    {shop.category}
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-ink-900">
                    {shop.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {shop.neighborhood} • Delivery in about {shop.etaMinutes}{' '}
                    mins
                  </p>
                </div>

                <Link
                  className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-nearcart-200 hover:text-nearcart-700"
                  to="/cart"
                >
                  Open cart
                </Link>
              </div>
            </article>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2">
            {isLoading
              ? Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={`product-skeleton-${index}`}
                    className="h-96 animate-pulse rounded-[1.75rem] border border-white/80 bg-white/75"
                  />
                ))
              : shop?.products.map((product) => {
                  const cartItem = items.find(
                    (item) => item.storeProductId === product.storeProductId,
                  )

                  return (
                    <ProductCard
                      key={product.storeProductId}
                      onAddToCart={() => handleAddToCart(product)}
                      onDecreaseQty={() => decreaseQty(product.storeProductId)}
                      onIncreaseQty={() => increaseQty(product.storeProductId)}
                      onUpdateQty={(quantity) =>
                        updateQty(product.storeProductId, quantity)
                      }
                      product={product}
                      quantityInCart={cartItem?.quantity ?? 0}
                    />
                  )
                })}
          </section>
        </div>

        <aside className="space-y-4">
          <article className="rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
              Your cart
            </p>
            <h2 className="mt-3 font-display text-2xl text-ink-900">
              {cartCount > 0
                ? `${cartCount} item${cartCount === 1 ? '' : 's'} in cart`
                : 'Your cart is empty'}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {cartCount > 0 && cartShopName
                ? `Current cart shop: ${cartShopName}. Adding from a different shop asks for confirmation before replacing the cart.`
                : 'Add a few products to get started. Your selected item details stay with the cart as you continue shopping.'}
            </p>

            <div className="mt-6 rounded-[1.5rem] bg-nearcart-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>Subtotal</span>
                <span className="font-semibold text-nearcart-700">
                  {formatCurrency(cartSubtotal)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="inline-flex rounded-full bg-nearcart-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-nearcart-700"
                to="/cart"
              >
                View cart
              </Link>
              <Link
                className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-nearcart-200 hover:text-nearcart-700"
                to="/shops"
              >
                Browse shops
              </Link>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
              Good to know
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <li>You can keep your cart focused on one shop for a simpler checkout flow.</li>
              <li>If you switch shops, NearCart asks before replacing the current cart.</li>
              <li>Your subtotal updates instantly as you add or adjust quantities.</li>
            </ul>
          </article>

          {cartShopId && cartShopId !== shopId ? (
            <article className="rounded-[1.5rem] border border-amber-200 bg-amber-50/90 p-5 text-sm text-amber-900">
              Your cart belongs to {cartShopName}. Adding from this shop will
              ask before clearing the existing cart.
            </article>
          ) : null}
        </aside>
      </section>
    </div>
  )
}
