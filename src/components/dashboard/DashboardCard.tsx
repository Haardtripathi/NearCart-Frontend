import type { ReactNode } from 'react'

interface DashboardCardProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function DashboardCard({
  title,
  description,
  actions,
  children,
}: DashboardCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-ink-100 bg-white p-6 shadow-[var(--shadow-card)] transition-shadow duration-200 sm:p-7">
      {title || description || actions ? (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            {title ? (
              <h2 className="font-display text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-ink-500">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
