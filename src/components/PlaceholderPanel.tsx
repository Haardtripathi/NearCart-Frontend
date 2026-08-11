interface PlaceholderPanelProps {
  title: string
  description: string
  points: string[]
}

export function PlaceholderPanel({
  title,
  description,
  points,
}: PlaceholderPanelProps) {
  return (
    <section className="rounded-[1.75rem] border border-ink-100 bg-white p-8 shadow-[var(--shadow-card)]">
      <div className="space-y-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-nearkart-50 text-2xl">🛠️</span>
        <h2 className="font-display text-2xl font-bold text-ink-900">{title}</h2>
        <p className="text-sm leading-7 text-ink-500">{description}</p>
      </div>
      <ul className="mt-6 space-y-3">
        {points.map((point) => (
          <li
            key={point}
            className="flex items-start gap-3 rounded-2xl bg-nearkart-50 px-4 py-3 text-sm font-medium text-ink-700"
          >
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-nearkart-500" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
