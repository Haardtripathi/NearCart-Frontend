import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import brandMark from '@/assets/nearkart-mark.svg'

interface AuthPageShellProps {
  eyebrow: string
  title: string
  description: string
  featureTitle: string
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
  featurePoints,
  children,
  footerPrompt,
  footerLabel,
  footerTo,
}: AuthPageShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_460px] lg:gap-12">
        {/* Left Side: Visual/Info — shown after the form on mobile so the actual task comes first */}
        <section className="relative order-2 flex flex-col justify-center space-y-10 overflow-hidden rounded-[2rem] border border-ink-100 bg-ink-50/50 p-8 sm:p-12 lg:order-1 lg:space-y-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-nearkart-200/40 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-accent-200/30 blur-3xl"
          />

          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-glass">
              <img alt="NearKart" className="h-8 w-8" src={brandMark} />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-ink-900">NearKart</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400">Commerce OS</p>
            </div>
          </div>

          <div className="relative space-y-5 sm:space-y-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-nearkart-600">
              {eyebrow}
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="max-w-md text-base leading-relaxed text-ink-500 sm:text-lg">
              {description}
            </p>
          </div>

          <div className="relative space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">{featureTitle}</h2>
            <div className="grid gap-3">
              {featurePoints.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white px-5 py-4 text-sm font-medium text-ink-700 shadow-[var(--shadow-card)]"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-nearkart-50 text-xs text-nearkart-700">✓</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Side: Form */}
        <section className="order-1 flex flex-col justify-center lg:order-2">
          <div className="rounded-[2rem] border border-ink-100 bg-white p-6 shadow-glass sm:rounded-[3rem] sm:p-10">
            {children}

            <div className="mt-8 border-t border-ink-50 pt-8 text-center text-sm">
              <span className="text-ink-400">{footerPrompt}</span>{' '}
              <Link className="font-bold text-nearkart-600 transition hover:text-nearkart-700 hover:underline underline-offset-4" to={footerTo}>
                {footerLabel}
              </Link>
            </div>
          </div>

          <p className="mt-8 px-4 text-center text-[10px] font-medium leading-relaxed text-ink-400 sm:px-10">
            By continuing, you agree to NearKart's Terms of Service and Privacy Policy. All transactions are secure and encrypted.
          </p>
        </section>
      </div>
    </div>
  )
}
