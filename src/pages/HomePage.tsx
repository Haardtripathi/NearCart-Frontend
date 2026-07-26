import { Link } from 'react-router-dom'

export function HomePage() {
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(240,166,64,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(88,122,43,0.12),transparent_40%)]" />
        <div className="relative z-10 mx-auto max-w-4xl space-y-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md ring-1 ring-white/20">
            <span className="h-2 w-2 animate-pulse rounded-full bg-nearkart-400" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-nearkart-100">Live in your neighborhood</span>
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Fresh groceries from <span className="bg-gradient-to-r from-sun-300 to-nearkart-300 bg-clip-text text-transparent">shops you trust.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-ink-200 sm:text-xl">
            Browse local favorites, build your cart, and get everything delivered from your neighborhood stores in minutes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-nearkart-600 px-10 text-base font-bold text-white shadow-xl shadow-nearkart-600/30 transition hover:bg-nearkart-700 hover:scale-[1.02] active:scale-95"
              to="/shops"
            >
              Start Shopping
            </Link>
            <Link
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-white/10 px-8 text-base font-bold text-white backdrop-blur-md ring-1 ring-white/20 transition hover:bg-white/20 hover:scale-[1.02] active:scale-95"
              to="/orders"
            >
              Track Orders
            </Link>
          </div>
        </div>
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
