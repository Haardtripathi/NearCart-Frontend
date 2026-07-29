import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { getShopCategories, getShops } from '@/api/shops'
import { CategoryChips } from '@/components/category/CategoryChips'
import { PageHeader } from '@/components/PageHeader'
import { ShopCard } from '@/components/shop/ShopCard'
import { useCustomerCity } from '@/hooks/useCustomerCity'
import type { PublicShopCategorySummary, PublicShopSummary } from '@/types/api'

export function ShopsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const category = searchParams.get('category') ?? ''
  const { city } = useCustomerCity()

  const [shops, setShops] = useState<PublicShopSummary[]>([])
  const [categories, setCategories] = useState<PublicShopCategorySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    async function loadShops() {
      try {
        const response = await getShops({
          search: search || undefined,
          category: category || undefined,
          city,
        })

        if (!isMounted) {
          return
        }

        setShops(response.items)
        setErrorMessage(null)
      } catch {
        if (!isMounted) {
          return
        }

        setErrorMessage('Unable to load shops right now.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadShops()

    return () => {
      isMounted = false
    }
  }, [search, category, city])

  useEffect(() => {
    let isMounted = true

    async function loadCategories() {
      try {
        const response = await getShopCategories()

        if (isMounted) {
          setCategories(response.items)
        }
      } catch {
        if (isMounted) {
          setCategories([])
        }
      }
    }

    void loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  function updateParam(key: 'search' | 'category', value: string) {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)

      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }

      return nextParams
    })
  }

  function clearFilters() {
    setSearchParams({})
  }

  return (
    <div className="space-y-12">
      <PageHeader
        description="Pick a nearby shop and start building your cart with fresh local groceries delivered to your door."
        eyebrow="Shop Discovery"
        title="Find your favorite shops"
      />

      <CategoryChips
        activeCategory={category}
        onSelect={(value) => updateParam('category', value === category ? '' : value)}
      />

      {/* Filter Bar — mirrors the per-shop filter bar pattern in ShopDetailsPage */}
      <div className="flex flex-wrap items-center gap-3 rounded-[2rem] border border-ink-100 bg-white p-2 shadow-sm">
        <input
          className="flex-1 min-w-[200px] rounded-2xl border-none bg-ink-50/50 px-5 py-3 text-sm font-medium text-ink-900 outline-none transition focus:bg-white focus:ring-1 focus:ring-nearkart-200"
          onChange={(event) => updateParam('search', event.target.value)}
          placeholder="Search shops by name..."
          value={search}
        />
        <select
          className="rounded-2xl border-none bg-ink-50/50 px-4 py-3 text-sm font-bold text-ink-700 outline-none transition focus:bg-white focus:ring-1 focus:ring-nearkart-200"
          onChange={(event) => updateParam('category', event.target.value)}
          value={category}
        >
          <option value="">All Categories</option>
          {categories.map((option) => (
            <option key={option.category} value={option.category}>
              {option.category}
            </option>
          ))}
        </select>
        {(search || category) && (
          <button
            className="text-xs font-bold text-nearkart-600 underline underline-offset-4"
            onClick={clearFilters}
            type="button"
          >
            Clear
          </button>
        )}
      </div>

      {errorMessage ? (
        <section className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-600">
          {errorMessage}
        </section>
      ) : null}

      <div>
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={`shop-skeleton-${index}`}
                className="h-64 animate-pulse rounded-3xl bg-ink-50"
              />
            ))}
          </div>
        ) : errorMessage ? null : shops.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-[2.5rem] border border-dashed border-ink-200 bg-ink-50/50 p-8 sm:p-12">
            <div className="mx-auto flex max-w-sm flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-4xl shadow-sm">
                🏪
              </div>
              <h3 className="font-display text-xl font-bold text-ink-900">No shops found</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {search || category
                  ? "We couldn't find any shops matching your filters. Try adjusting your search."
                  : "We couldn't find any registered shops in your area. Check back soon as we onboard new local partners."}
              </p>
              <div className="mt-8">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-ink-900 px-6 text-sm font-bold text-white transition hover:shadow-lg active:scale-95"
                  to="/"
                >
                  Back Home
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
