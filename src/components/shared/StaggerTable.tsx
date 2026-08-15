import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * Table-row equivalent of `StaggerGrid`/`StaggerItem` (see that file) — `<tr>`/`<tbody>` can't be
 * wrapped in the `motion.div`s those two render (invalid HTML nesting inside a `<table>`), so
 * this applies the exact same stagger-entrance variants directly to `motion.tbody`/`motion.tr`
 * instead. Same reduced-motion posture: collapses to an instant, motionless render under
 * `prefers-reduced-motion`.
 */
export function StaggerTableBody({
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
    <motion.tbody
      animate="visible"
      className={className}
      initial="hidden"
      variants={{
        hidden: {},
        visible: {
          transition: prefersReducedMotion ? {} : { staggerChildren: staggerDelay },
        },
      }}
    >
      {children}
    </motion.tbody>
  )
}

export function StaggerTableRow({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.tr
      className={className}
      variants={{
        hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: prefersReducedMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.tr>
  )
}
