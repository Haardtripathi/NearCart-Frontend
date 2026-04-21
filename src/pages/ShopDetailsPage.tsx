import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getShopCatalog } from '@/api/shops'
import { PageHeader } from '@/components/PageHeader'
import { ProductCard } from '@/components/shop/ProductCard'
import { useCartStore } from '@/store/cartStore'
import type { PublicCatalogProduct, PublicShopDetail } from '@/types/api'
import type { CartItem } from '@/types/cart'
import { formatCurrency } from '@/utils/formatCurrency'

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

function createCartItem(shop: PublicShopDetail, product: PublicCatalogProduct): CartItem {
  return {
    cartItemId: `${product.id}:${product.variantId}`,
    productId: product.id,
    variantId: product.variantId,
    shopId: shop.id,
    shopName: shop.name,
    name: product.name,
    description: product.description,
    brand: product.brand?.name ?? null,
    category: product.category?.name ?? null,
    unitLabel: product.unitLabel,
    image: product.image,
    price: product.price,
    mrp: product.mrp,
    stockQty: product.availableQty,
    stockStatus: product.stockStatus,
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
  const [brands, setBrands] = useState<
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
          brand: filters.brand || undefined,
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
        setBrands(response.filters.brands)
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

  function handleAddToCart(product: PublicCatalogProduct) {
    if (!shop) {
      return
    }

    const cartItem = createCartItem(shop, product)
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
            ? `Browse live products from ${shop.name}, filter by category or brand, and add only what is currently available.`
            : 'Loading live shop catalog.'
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
                    {[shop.area, shop.city].filter(Boolean).join(', ')} •{' '}
                    {shop.estimatedDeliveryMinutes
                      ? `Delivery in about ${shop.estimatedDeliveryMinutes} mins`
                      : 'Delivery estimate available at checkout'}
                  </p>
                </div>

                <Link
                  className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-nearcart-200 hover:text-nearcart-700"
                  to="/cart"
                >
                  Open cart
                </Link>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <input
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-nearcart-400"
                  onChange={(event) => updateFilter('search', event.target.value)}
                  placeholder="Search products"
                  value={filters.search}
                />
                <select
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-nearcart-400"
                  onChange={(event) => updateFilter('category', event.target.value)}
                  value={filters.category}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-nearcart-400"
                  onChange={(event) => updateFilter('brand', event.target.value)}
                  value={filters.brand}
                >
                  <option value="">All brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.slug}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-nearcart-400"
                  onChange={(event) =>
                    updateFilter('sort', event.target.value as CatalogSort)
                  }
                  value={filters.sort}
                >
                  <option value="featured">Featured</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="price-asc">Price low to high</option>
                  <option value="price-desc">Price high to low</option>
                  <option value="newest">Newest</option>
                </select>
              </div>

              <label className="mt-4 inline-flex items-center gap-3 text-sm text-slate-600">
                <input
                  checked={filters.inStockOnly}
                  onChange={(event) =>
                    updateFilter('inStockOnly', event.target.checked)
                  }
                  type="checkbox"
                />
                Show only in-stock items
              </label>
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
              : products.map((product) => {
                  const cartItem = items.find(
                    (item) => item.cartItemId === `${product.id}:${product.variantId}`,
                  )

                  return (
                    <ProductCard
                      key={`${product.id}:${product.variantId}`}
                      onAddToCart={() => handleAddToCart(product)}
                      onDecreaseQty={() =>
                        cartItem && decreaseQty(cartItem.cartItemId)
                      }
                      onIncreaseQty={() =>
                        cartItem && increaseQty(cartItem.cartItemId)
                      }
                      onUpdateQty={(quantity) =>
                        cartItem && updateQty(cartItem.cartItemId, quantity)
                      }
                      product={product}
                      quantityInCart={cartItem?.quantity ?? 0}
                    />
                  )
                })}
          </section>

          {!isLoading && products.length === 0 ? (
            <article className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/80 p-8 text-center text-sm text-slate-600">
              No products match the current filters.
            </article>
          ) : null}
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
                ? `Current cart shop: ${cartShopName}. Live catalog quantities still get rechecked before checkout.`
                : 'Add a few products to get started. Cart totals update from the same normalized catalog data used by the public APIs.'}
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
              <li>Product cards now come from the mapped inventory organization and branch.</li>
              <li>Stock badges and quantities are branch-aware instead of hardcoded.</li>
              <li>Checkout validates the same catalog again before an order is created.</li>
            </ul>
          </article>

          {cartShopId && cartShopId !== shop?.id ? (
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
