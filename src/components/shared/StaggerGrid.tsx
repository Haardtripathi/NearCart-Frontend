import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * Shared stagger-entrance primitives for grids/lists (shop grid, product grid, cart items, order
 * list, dashboard rows, etc.) — `StaggerGrid` sets up the parent's `staggerChildren` timing,
 * `StaggerItem` is the per-child fade-up. Both collapse to an instant, motionless render under
 * `prefers-reduced-motion`, matching the same posture as `PageTransition` and the CSS `nk-*`
 * keyframes in index.css.
 */
export function StaggerGrid({
  children,
  className = '',
  staggerDelay = 0.05,
}: {
  children: ReactNode
  className?: string
  staggerDelay?: number
}) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: prefersReducedMotion ? {} : { staggerChildren: staggerDelay },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      variants={{
        hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
