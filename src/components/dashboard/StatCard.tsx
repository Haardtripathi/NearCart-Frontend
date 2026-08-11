interface StatCardProps {
  label: string
  value: string | number
  description: string
}

export function StatCard({ label, value, description }: StatCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] border border-ink-100 bg-white p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-nearkart-50 opacity-70 transition-transform duration-300 group-hover:scale-110"
      />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-nearkart-600">
          {label}
        </p>
        <p className="mt-3 font-display text-3xl font-extrabold text-ink-900">{value}</p>
        <p className="mt-2 text-sm leading-6 text-ink-500">{description}</p>
      </div>
    </article>
  )
}
