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
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <div className="grid w-full gap-12 lg:grid-cols-[1fr_450px]">
        {/* Left Side: Visual/Info */}
        <section className="flex flex-col justify-center space-y-12 rounded-[3.5rem] border border-ink-100 bg-ink-50/50 p-12">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-glass">
              <img alt="NearKart" className="h-8 w-8" src={brandMark} />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-ink-900">NearKart</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400">Commerce OS</p>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-nearkart-600">
              {eyebrow}
            </p>
            <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-ink-900">
              {title}
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-ink-500">
              {description}
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">{featureTitle}</h2>
            <div className="grid gap-3">
              {featurePoints.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white px-5 py-4 text-sm font-medium text-ink-700 shadow-sm"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-nearkart-50 text-xs">✓</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Side: Form */}
        <section className="flex flex-col justify-center">
          <div className="rounded-[3rem] border border-ink-100 bg-white p-10 shadow-glass">
            {children}

            <div className="mt-8 border-t border-ink-50 pt-8 text-center text-sm">
              <span className="text-ink-400">{footerPrompt}</span>{' '}
              <Link className="font-bold text-nearkart-600 transition hover:text-nearkart-700 hover:underline underline-offset-4" to={footerTo}>
                {footerLabel}
              </Link>
            </div>
          </div>

          <p className="mt-8 px-10 text-center text-[10px] font-medium leading-relaxed text-ink-400">
            By continuing, you agree to NearKart's Terms of Service and Privacy Policy. All transactions are secure and encrypted.
          </p>
        </section>
      </div>
    </div>
  )
}
