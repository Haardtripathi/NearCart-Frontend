import { motion, useReducedMotion } from 'framer-motion'

import brandMark from '@/assets/nearkart-mark.svg'

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

/**
 * Branded loading state — the NearKart mark breathing gently in place of a generic spinner, so
 * even a "please wait" moment carries the brand instead of feeling like a template default. Under
 * `prefers-reduced-motion` the mark renders fully static (no pulse, no ring), matching the same
 * posture as `PageTransition`/`StaggerGrid`.
 */
export function LoadingScreen({
  message = 'Loading your NearKart workspace...',
  fullScreen = false,
}: LoadingScreenProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      className={[
        'flex items-center justify-center rounded-[1.75rem] border border-ink-100 bg-white p-8 shadow-[var(--shadow-card)]',
        fullScreen ? 'min-h-screen rounded-none border-none shadow-none' : 'min-h-56',
      ].join(' ')}
    >
      <div className="space-y-5 text-center">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
          {prefersReducedMotion ? null : (
            <motion.span
              animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.35, 1] }}
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl bg-nearkart-200"
              transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
            />
          )}
          <motion.img
            alt=""
            animate={prefersReducedMotion ? undefined : { scale: [1, 1.06, 1] }}
            aria-hidden="true"
            className="relative h-16 w-16 rounded-2xl border border-nearkart-100 bg-white p-2.5 shadow-[var(--shadow-card)]"
            src={brandMark}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 1.8, ease: 'easeInOut', repeat: Infinity }
            }
          />
        </div>
        <p aria-live="polite" className="text-sm font-semibold text-ink-600" role="status">
          {message}
        </p>
      </div>
    </div>
  )
}
