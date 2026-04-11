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
    <section className="rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.35)]">
      {title || description || actions ? (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            {title ? (
              <h2 className="font-display text-2xl text-ink-900">{title}</h2>
            ) : null}
            {description ? (
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  )
}
