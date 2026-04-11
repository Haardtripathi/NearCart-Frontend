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
    <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_20px_70px_-40px_rgba(17,33,23,0.45)] backdrop-blur">
      <div className="space-y-3">
        <h2 className="font-display text-2xl text-ink-900">{title}</h2>
        <p className="text-sm leading-7 text-slate-600">{description}</p>
      </div>
      <ul className="mt-6 space-y-3">
        {points.map((point) => (
          <li
            key={point}
            className="flex items-start gap-3 rounded-2xl bg-nearcart-50 px-4 py-3 text-sm text-slate-700"
          >
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-nearcart-500" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
