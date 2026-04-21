import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-lg rounded-[2rem] border border-white/80 bg-white/90 p-8 text-center shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-nearkart-600">
          404
        </p>
        <h1 className="mt-4 font-display text-4xl text-ink-900">
          That page could not be found.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Head back to the homepage to keep browsing shops and orders.
        </p>
        <Link
          className="mt-6 inline-flex rounded-full bg-nearkart-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-nearkart-700"
          to="/"
        >
          Return home
        </Link>
      </div>
    </section>
  )
}
