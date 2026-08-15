import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getShopCatalog } from '@/api/shops'
import { PageHeader } from '@/components/PageHeader'
import { StarRating } from '@/components/StarRating'
import { StatusPill } from '@/components/StatusPill'
import { ProductCard } from '@/components/shop/ProductCard'
import { ShopImage } from '@/components/shop/ShopImage'
import { ShopReviewsSection } from '@/components/shop/ShopReviewsSection'
import { StaggerGrid, StaggerItem } from '@/components/shared/StaggerGrid'
import { useCartStore } from '@/store/cartStore'
import type { PublicCatalogProduct, PublicCatalogVariant, PublicShopDetail } from '@/types/api'
import type { CartItem } from '@/types/cart'
import { formatLiveEta, getLiveEtaTone } from '@/utils/deliveryEta'
import { formatCurrency } from '@/utils/formatCurrency'
import { getTodayStatusLabel, getTodayStatusMessage } from '@/utils/shopAvailability'

type CatalogSort =
  | 'featured'
  | 'name-asc'
  | 'price-asc'
  | 'price-desc'
  | 'newest'

interface CatalogFiltersState {
  search: string
  category: string
  brand: string
  inStockOnly: boolean
  sort: CatalogSort
}

const initialFilters: CatalogFiltersState = {
  search: '',
  category: '',
  brand: '',
  inStockOnly: false,
  sort: 'featured',
}

function createCartItem(
  shop: PublicShopDetail,
  product: PublicCatalogProduct,
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

export function ShopDetailsPage() {
  const { shopId = '' } = useParams()
  const [shop, setShop] = useState<PublicShopDetail | null>(null)
  const [products, setProducts] = useState<PublicCatalogProduct[]>([])
  const [categories, setCategories] = useState<
    Array<{ id: string; slug: string; name: string }>
  >([])
  const [filters, setFilters] = useState<CatalogFiltersState>(initialFilters)
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

    async function loadCatalog() {
      setIsLoading(true)

      try {
        const response = await getShopCatalog(shopId, {
          search: filters.search || undefined,
          category: filters.category || undefined,
          inStockOnly: filters.inStockOnly || undefined,
          sort: filters.sort,
          page: 1,
          limit: 24,
        })

        if (!isMounted) {
          return
        }

        setShop(response.item)
        setProducts(response.items)
        setCategories(response.filters.categories)
        setErrorMessage(null)
      } catch {
        if (!isMounted) {
          return
        }

        setErrorMessage('Unable to load this shop right now.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadCatalog()

    return () => {
      isMounted = false
    }
  }, [filters, shopId])

  function updateFilter<Key extends keyof CatalogFiltersState>(
    key: Key,
    value: CatalogFiltersState[Key],
  ) {
    setFilters((currentState) => ({
      ...currentState,
      [key]: value,
    }))
  }

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

  function handleAddToCart(product: PublicCatalogProduct) {
    if (!shop || shop.todayStatus !== 'OPEN') {
      return
    }

    addCartItem(createCartItem(shop, product))
  }

  function handleAddVariant(product: PublicCatalogProduct, variant: PublicCatalogVariant) {
    if (!shop || shop.todayStatus !== 'OPEN') {
      return
    }

    addCartItem(createCartItem(shop, product, variant))
  }

  const cartCount = getCartCount()
  const cartSubtotal = getCartSubtotal()
  const isShopOpenToday = shop ? shop.todayStatus === 'OPEN' : true
  const todayStatusMessage = shop ? getTodayStatusMessage(shop) : null

  return (
    <div className="space-y-12">
      {shop ? (
        <div className="relative -mx-6 h-48 overflow-hidden rounded-b-[2.5rem] sm:-mx-8 lg:-mx-10 lg:h-64">
          <ShopImage
            category={shop.category}
            className="h-full w-full blur-sm scale-110"
            iconClassName="text-6xl opacity-0"
            logoImageUrl={shop.logoImageUrl}
            name={shop.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />
        </div>
      ) : null}

      <PageHeader
        eyebrow="Shop Catalog"
        title={shop ? shop.name : 'Catalog'}
        description={
          shop
            ? `Browse and order fresh local groceries from ${shop.name}.`
            : 'Loading live shop catalog...'
        }
      />

      {shop ? (
        <div className="-mt-8 flex items-center gap-3">
          {shop.averageRating != null ? (
            <>
              <StarRating value={shop.averageRating} />
              <span className="text-sm font-bold text-ink-900">
                {shop.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-ink-400">
                ({shop.reviewCount} review{shop.reviewCount === 1 ? '' : 's'})
              </span>
            </>
          ) : (
            <span className="text-sm text-ink-400">No reviews yet</span>
          )}
        </div>
      ) : null}

      {todayStatusMessage ? (
        <section
          className={`rounded-[1.75rem] border p-6 text-sm ${shop?.todayStatus === 'CLOSED'
              ? 'border-rose-200 bg-rose-50/90 text-rose-800'
              : 'border-amber-200 bg-amber-50/90 text-amber-900'
            }`}
        >
          <p className="font-semibold">
            {shop?.todayStatus === 'CLOSED'
              ? "This shop is closed today — you can't place an order right now."
              : "This shop hasn't confirmed today's hours yet."}
          </p>
          <p className="mt-1">{todayStatusMessage}</p>
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-2xl border border-accent-100 bg-accent-50/60 p-4 text-sm text-accent-700">
          {errorMessage}
        </section>
      ) : null}

      <div className="grid gap-12 lg:grid-cols-[1fr_350px]">
        <div className="space-y-10">
          {shop ? (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="flex flex-wrap items-center gap-3 rounded-[2rem] border border-ink-100 bg-white p-2 shadow-sm">
                <input
                  className="flex-1 min-w-[200px] rounded-2xl border-none bg-ink-50/50 px-5 py-3 text-sm font-medium text-ink-900 outline-none transition focus:bg-white focus:ring-1 focus:ring-nearkart-200"
                  onChange={(event) => updateFilter('search', event.target.value)}
                  placeholder="Search in this shop..."
                  value={filters.search}
                />
                <select
                  className="rounded-2xl border-none bg-ink-50/50 px-4 py-3 text-sm font-bold text-ink-700 outline-none transition focus:bg-white focus:ring-1 focus:ring-nearkart-200"
                  onChange={(event) => updateFilter('category', event.target.value)}
                  value={filters.category}
                >
                  <option value="">Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-2xl border-none bg-ink-50/50 px-4 py-3 text-sm font-bold text-ink-700 outline-none transition focus:bg-white focus:ring-1 focus:ring-nearkart-200"
                  onChange={(event) => updateFilter('sort', event.target.value as CatalogSort)}
                  value={filters.sort}
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="name-asc">A-Z</option>
                  <option value="price-asc">Price: Low</option>
                  <option value="price-desc">Price: High</option>
                </select>
              </div>

              <div className="flex items-center gap-6 px-4">
                <label className="inline-flex cursor-pointer items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-ink-400 select-none">
                  <input
                    checked={filters.inStockOnly}
                    className="h-4 w-4 rounded border-ink-200 text-nearkart-600 focus:ring-nearkart-500"
                    onChange={(event) =>
                      updateFilter('inStockOnly', event.target.checked)
                    }
                    type="checkbox"
                  />
                  In Stock Only
                </label>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={`product-skeleton-${index}`}
                  className="h-[420px] animate-pulse rounded-[2rem] bg-ink-50"
                />
              ))}
            </div>
          ) : (
            <StaggerGrid className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const productCartItems = items.filter(
                  (item) => item.productId === product.id,
                )
                const defaultCartItem = productCartItems.find(
                  (item) => item.variantId === product.variantId,
                )
                const variantQuantities = Object.fromEntries(
                  productCartItems
                    .filter((item) => item.variantId)
                    .map((item) => [item.variantId as string, item.quantity]),
                )

                return (
                  <StaggerItem key={`${product.id}:${product.variantId}`}>
                    <ProductCard
                      onAddToCart={() => handleAddToCart(product)}
                      onAddVariant={(variant) => handleAddVariant(product, variant)}
                      onDecreaseQty={() =>
                        defaultCartItem && decreaseQty(defaultCartItem.cartItemId)
                      }
                      onDecreaseVariant={(variant) =>
                        decreaseQty(`${product.id}:${variant.id}`)
                      }
                      onIncreaseQty={() =>
                        defaultCartItem && increaseQty(defaultCartItem.cartItemId)
                      }
                      onIncreaseVariant={(variant) =>
                        increaseQty(`${product.id}:${variant.id}`)
                      }
                      onUpdateQty={(quantity) =>
                        defaultCartItem && updateQty(defaultCartItem.cartItemId, quantity)
                      }
                      onUpdateVariantQty={(variant, quantity) =>
                        updateQty(`${product.id}:${variant.id}`, quantity)
                      }
                      orderingDisabled={!isShopOpenToday}
                      orderingDisabledLabel={shop ? getTodayStatusLabel(shop.todayStatus) : undefined}
                      product={product}
                      quantityInCart={defaultCartItem?.quantity ?? 0}
                      variantQuantities={variantQuantities}
                    />
                  </StaggerItem>
                )
              })}
            </StaggerGrid>
          )}

          {!isLoading && !errorMessage && products.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-ink-100 bg-white/50 p-12 text-center">
              <div className="mb-4 text-3xl">🔍</div>
              <h3 className="font-display text-lg font-bold text-ink-900">No products found</h3>
              <p className="mt-1 text-sm text-ink-400">Try adjusting your filters or search terms.</p>
              <button
                onClick={() => setFilters(initialFilters)}
                className="mt-6 text-sm font-bold text-nearkart-600 underline underline-offset-4"
              >
                Clear all filters
              </button>
            </div>
          ) : null}

          {shop ? (
            <div className="space-y-6">
              <h3 className="font-display text-xl font-bold text-ink-900">Customer reviews</h3>
              <ShopReviewsSection shopId={shop.id} />
            </div>
          ) : null}
        </div>

        <aside className="relative">
          <div className="sticky top-28 space-y-6">
            <article className="overflow-hidden rounded-[2.5rem] border border-ink-100 bg-white shadow-glass transition-all hover:shadow-glass-strong">
              <div className="border-b border-ink-50 bg-ink-50/30 px-8 py-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-nearkart-600">
                  Quick Cart
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-ink-900">
                  {cartCount > 0
                    ? `${cartCount} item${cartCount === 1 ? '' : 's'}`
                    : 'Order Summary'}
                </h2>
              </div>

              <div className="space-y-6 p-8">
                <p className="text-sm leading-relaxed text-ink-500">
                  {cartCount > 0 && cartShopName
                    ? `You're ordering from ${cartShopName}. Items are revalidated at checkout.`
                    : 'Add fresh groceries from this catalog to see your order subtotal here.'}
                </p>

                {cartCount > 0 && (
                  <div className="rounded-2xl bg-ink-900 p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between opacity-80">
                      <span className="text-xs font-bold uppercase tracking-wider">Subtotal</span>
                      <span className="text-sm font-medium">{formatCurrency(cartSubtotal)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                      <span className="text-sm font-bold">Total Estimate</span>
                      <span className="text-xl font-bold">{formatCurrency(cartSubtotal)}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {isShopOpenToday ? (
                    <Link
                      className="flex h-12 items-center justify-center rounded-xl bg-nearkart-600 text-sm font-bold text-white shadow-md shadow-nearkart-600/20 transition hover:bg-nearkart-700 active:scale-95"
                      to="/cart"
                    >
                      Checkout Now
                    </Link>
                  ) : (
                    <button
                      className="flex h-12 cursor-not-allowed items-center justify-center rounded-xl bg-ink-50 text-sm font-bold text-ink-300"
                      disabled
                      type="button"
                    >
                      {shop ? getTodayStatusLabel(shop.todayStatus) : 'Unavailable'}
                    </button>
                  )}
                  <Link
                    className="flex h-12 items-center justify-center rounded-xl border border-ink-100 bg-white text-sm font-bold text-ink-700 transition hover:bg-ink-50 active:scale-95"
                    to="/shops"
                  >
                    Browse Other Shops
                  </Link>
                </div>
              </div>
            </article>

            {shop && (
              <article className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <ShopImage
                    category={shop.category}
                    className="h-12 w-12 flex-shrink-0 rounded-2xl"
                    iconClassName="text-xl"
                    logoImageUrl={shop.logoImageUrl}
                    name={shop.name}
                  />
                  <div>
                    <h4 className="font-bold text-ink-900">{shop.name}</h4>
                    <p className="text-xs text-ink-400">{shop.category}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 border-t border-ink-50 pt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-400">Min. Order</span>
                    <span className="font-bold text-ink-700">₹{shop.minimumOrderAmount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-400">Live ETA</span>
                    <StatusPill
                      label={formatLiveEta(shop.liveEstimatedDeliveryMinutes)}
                      tone={getLiveEtaTone(shop.liveEstimatedDeliveryMinutes)}
                    />
                  </div>
                  {shop.deliveryFee != null ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-400">Delivery fare</span>
                      <span className="font-bold text-ink-700">
                        ₹{shop.deliveryFee}
                        {shop.distanceKm != null ? ` · ${shop.distanceKm} km` : ''}
                      </span>
                    </div>
                  ) : null}
                </div>
              </article>
            )}

            {cartShopId && cartShopId !== shop?.id ? (
              <div className="rounded-2xl border border-sun-200 bg-sun-50 p-4 shadow-sm ring-1 ring-sun-100">
                <div className="flex gap-3">
                  <span className="text-sun-600">⚠️</span>
                  <p className="text-xs font-medium leading-relaxed text-sun-900">
                    Your cart has items from <span className="font-bold">{cartShopName}</span>. Adding items here will ask to clear your current cart.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
