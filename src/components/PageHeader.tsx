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
    <header className="space-y-3">
      {eyebrow ? (
        <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-nearkart-600">
          <span className="h-1.5 w-1.5 rounded-full bg-nearkart-500" aria-hidden="true" />
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-2.5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-ink-500 sm:text-base">
          {description}
        </p>
      </div>
    </header>
  )
}
