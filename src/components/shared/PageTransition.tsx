import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

/**
 * Route-level entrance transition, applied once at the layout level (see MainLayout/
 * DashboardLayout) so every page gets consistent motion for free instead of each page needing its
 * own bespoke animation. Keyed by pathname so React remounts (and replays the transition) on
 * every navigation, not just the first mount.
 *
 * `useReducedMotion()` collapses this to an instant opacity swap — framer-motion's own escape
 * hatch, parallel to the `prefers-reduced-motion` CSS block in index.css that already covers the
 * hand-rolled `animate-nk-*` keyframes.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const prefersReducedMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
