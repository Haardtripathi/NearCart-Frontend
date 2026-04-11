interface PageHeaderProps {
  title: string
  description: string
  eyebrow?: string
}

export function PageHeader({
  title,
  description,
  eyebrow,
}: PageHeaderProps) {
  return (
    <header className="space-y-4">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-nearcart-600">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-3">
        <h1 className="font-display text-3xl text-ink-900 sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
          {description}
        </p>
      </div>
    </header>
  )
}
