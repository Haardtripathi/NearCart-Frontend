import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import brandMark from '@/assets/nearkart-mark.svg'

interface AuthPageShellProps {
  eyebrow: string
  title: string
  description: string
  featureTitle: string
  featureDescription: string
  featurePoints: string[]
  children: ReactNode
  footerPrompt: string
  footerLabel: string
  footerTo: string
}

export function AuthPageShell({
  eyebrow,
  title,
  description,
  featureTitle,
  featureDescription,
  featurePoints,
  children,
  footerPrompt,
  footerLabel,
  footerTo,
}: AuthPageShellProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
      <section className="rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,rgba(88,122,43,0.12),rgba(240,166,64,0.14))] p-8 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.4)]">
        <div className="flex items-center gap-3">
          <img
            alt="NearKart"
            className="h-12 w-12 rounded-2xl border border-white/80 bg-white/90 p-2 shadow-[0_18px_40px_-28px_rgba(17,33,23,0.55)]"
            src={brandMark}
          />
          <div>
            <p className="font-display text-lg text-ink-900">NearKart</p>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Commerce OS
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-nearkart-600">
            {eyebrow}
          </p>
          <h1 className="font-display text-4xl leading-tight text-ink-900">
            {title}
          </h1>
          <p className="max-w-xl text-base leading-8 text-slate-600">
            {description}
          </p>
        </div>

        <article className="mt-10 rounded-[1.75rem] border border-white/80 bg-white/75 p-6 backdrop-blur">
          <h2 className="font-display text-2xl text-ink-900">{featureTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {featureDescription}
          </p>
          <ul className="mt-6 space-y-3">
            {featurePoints.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 rounded-2xl bg-nearkart-50/80 px-4 py-3 text-sm text-slate-700"
              >
                <span className="mt-1.5 h-2 w-2 rounded-full bg-nearkart-500" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white/95 p-8 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.4)]">
        {children}
        <p className="mt-6 text-sm text-slate-500">
          {footerPrompt}{' '}
          <Link className="font-semibold text-nearkart-700" to={footerTo}>
            {footerLabel}
          </Link>
        </p>
      </section>
    </div>
  )
}
