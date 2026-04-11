interface StatCardProps {
  label: string
  value: string | number
  description: string
}

export function StatCard({ label, value, description }: StatCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-white/80 bg-white/90 p-5 shadow-[0_16px_45px_-35px_rgba(17,33,23,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl text-ink-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  )
}
