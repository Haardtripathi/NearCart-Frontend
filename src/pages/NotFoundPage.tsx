import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-lg rounded-[2rem] border border-ink-100 bg-white p-10 text-center shadow-[var(--shadow-card-hover)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-nearkart-50 text-4xl">
          🧭
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-nearkart-600">
          404 — Lost in the neighborhood
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          That page could not be found.
        </h1>
        <p className="mt-4 text-sm leading-7 text-ink-500">
          Head back to the homepage to keep browsing shops and orders.
        </p>
        <Link className="btn-primary mt-8 h-12 px-8" to="/">
          Return home
        </Link>
      </div>
    </section>
  )
}
