import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getShops } from '@/api/shops'
import { CategoryChips } from '@/components/category/CategoryChips'
import { TrendingRail } from '@/components/home/TrendingRail'
import { ShopCard } from '@/components/shop/ShopCard'
import { StaggerGrid, StaggerItem } from '@/components/shared/StaggerGrid'
import { useCustomerCity } from '@/hooks/useCustomerCity'
import { useDeliveryCoordinates } from '@/hooks/useDeliveryCoordinates'
import type { PublicShopSummary } from '@/types/api'

const MIN_QUERY_LENGTH = 2

export function HomePage() {
  const navigate = useNavigate()
  const { city } = useCustomerCity()
  // Same hyperlocal filtering/sorting as ShopsPage — prefers a manually selected LocationBar
  // address over raw device geolocation, see useDeliveryCoordinates's doc comment.
  const { coordinates } = useDeliveryCoordinates()
  const [heroQuery, setHeroQuery] = useState('')
  const [nearbyShops, setNearbyShops] = useState<PublicShopSummary[]>([])
  const [isLoadingShops, setIsLoadingShops] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadShops() {
      try {
        const response = await getShops({
          city,
          lat: coordinates?.latitude,
          lng: coordinates?.longitude,
        })

        if (isMounted) {
          setNearbyShops(response.items.slice(0, 3))
        }
      } catch {
        if (isMounted) {
          setNearbyShops([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingShops(false)
        }
      }
    }

    void loadShops()

    return () => {
      isMounted = false
    }
  }, [city, coordinates])

  function handleHeroSearchSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = heroQuery.trim()

    if (trimmed.length < MIN_QUERY_LENGTH) {
      return
    }

    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const highlightCards = [
    {
      title: 'Comfortable on every screen',
      description:
        'Small neighborhood shops deserve a big experience. Our storefront scales beautifully across all your devices.',
    },
    {
      title: 'Everything stays in sync',
      description:
        'Shop discovery, cart building, and order flows stay connected as you move between shops and your cart.',
    },
    {
      title: 'Built to grow cleanly',
      description:
        'Focus on the essentials first, with a design that is ready for richer catalogs and better delivery tools.',
    },
  ]

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-ink-900 px-6 py-16 text-white shadow-glass-strong sm:px-12 sm:py-20 lg:px-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,128,25,0.28),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(226,55,68,0.2),transparent_40%)]" />
        <div className="relative z-10 mx-auto max-w-4xl space-y-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md ring-1 ring-white/20">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent-400" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-nearkart-100">Live in your neighborhood</span>
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Everything local, <span className="bg-gradient-to-r from-sun-300 to-nearkart-300 bg-clip-text text-transparent">delivered fast.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-ink-200 sm:text-xl">
            Search products across every shop near you, browse by category, and get everything delivered from your neighborhood stores in minutes.
          </p>

          <form
            className="mx-auto flex max-w-xl flex-col gap-3 pt-2 sm:flex-row"
            onSubmit={handleHeroSearchSubmit}
          >
            <input
              className="h-14 flex-1 rounded-2xl border-none bg-white/95 px-6 text-base font-medium text-ink-900 shadow-lg outline-none placeholder:text-ink-300 focus:ring-2 focus:ring-sun-400"
              onChange={(event) => setHeroQuery(event.target.value)}
              placeholder="Search for milk, rice, medicines..."
              type="search"
              value={heroQuery}
            />
            <button
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-sun-500 px-8 text-base font-bold text-ink-900 shadow-xl shadow-sun-500/30 transition hover:bg-sun-400 hover:scale-[1.02] active:scale-95"
              type="submit"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/10 px-8 text-sm font-bold text-white backdrop-blur-md ring-1 ring-white/20 transition hover:bg-white/20 hover:scale-[1.02] active:scale-95"
              to="/shops"
            >
              Browse All Shops
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/10 px-8 text-sm font-bold text-white backdrop-blur-md ring-1 ring-white/20 transition hover:bg-white/20 hover:scale-[1.02] active:scale-95"
              to="/orders"
            >
              Track Orders
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Shop by category</h2>
          <Link className="text-sm font-bold text-nearkart-600 hover:underline" to="/shops">
            See all
          </Link>
        </div>
        <CategoryChips />
      </section>

      {/* Trending */}
      <TrendingRail city={city} />

      {/* Shops near you */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Shops near you</h2>
          <Link className="text-sm font-bold text-nearkart-600 hover:underline" to="/shops">
            See all shops
          </Link>
        </div>

        {isLoadingShops ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={`home-shop-skeleton-${index}`} className="h-64 animate-pulse rounded-3xl bg-ink-50" />
            ))}
          </div>
        ) : nearbyShops.length === 0 ? (
          <p className="text-sm text-ink-400">No shops available yet — check back soon.</p>
        ) : (
          <StaggerGrid className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {nearbyShops.map((shop) => (
              <StaggerItem key={shop.id}>
                <ShopCard shop={shop} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}
      </section>

      {/* Features Grid */}
      <section className="space-y-12">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Why shop with NearKart?</h2>
          <p className="mt-4 text-ink-500">Built for speed, simplicity, and your neighborhood.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {highlightCards.map((card, idx) => (
            <article
              key={card.title}
              className="group relative rounded-3xl border border-ink-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-glass"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-nearkart-50 text-nearkart-600 group-hover:bg-nearkart-600 group-hover:text-white transition-colors">
                <span className="text-xl font-bold">{idx + 1}</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-ink-900">{card.title}</h3>
              <p className="mt-4 leading-relaxed text-ink-500">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Process Flow */}
      <section className="rounded-[3rem] bg-ink-50 p-8 sm:p-16">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="space-y-8">
            <h2 className="font-display text-4xl font-bold leading-tight text-ink-900">
              Shopping made <br className="hidden lg:block" /> simple again.
            </h2>
            <p className="text-lg text-ink-600">
              We've stripped away the clutter to focus on what matters: the food and the shops.
            </p>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-xl bg-ink-900 px-6 text-sm font-bold text-white transition hover:shadow-lg active:scale-95"
              to="/shops"
            >
              Learn More
            </Link>
          </div>

          <div className="grid gap-4">
            {[
              {
                title: 'Discover',
                desc: 'See which shops are open and delivering near you right now.',
                icon: '📍'
              },
              {
                title: 'Select',
                desc: 'Browse fresh inventories and build your cart with ease.',
                icon: '🥦'
              },
              {
                title: 'Enjoy',
                desc: 'Checkout securely and track your delivery to your door.',
                icon: '⚡'
              }
            ].map((step) => (
              <div key={step.title} className="flex gap-6 rounded-2xl border border-white bg-white/50 p-6 backdrop-blur-sm transition hover:bg-white">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                  {step.icon}
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-ink-900">{step.title}</h4>
                  <p className="text-sm text-ink-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
