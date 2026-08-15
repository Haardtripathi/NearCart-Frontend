import type { HTMLAttributes, ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type NativeDivProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
>

interface CardProps extends NativeDivProps {
  children: ReactNode
  hoverLift?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

/**
 * Shared card surface — rounded corners + soft shadow from the design tokens in `index.css`
 * (`card-surface`). Use this instead of re-declaring `rounded-2xl border ... shadow-sm` per page.
 *
 * `hoverLift` now uses a framer-motion spring instead of a CSS `transition-transform` — matches
 * the same physical, spring-based feel as `Button`'s hover/tap state instead of a linear ease.
 */
export function Card({
  children,
  hoverLift = false,
  padding = 'md',
  className = '',
  ...rest
}: CardProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className={['card-surface', paddingClasses[padding], className].filter(Boolean).join(' ')}
      whileHover={
        // Inlined literal shadow value (matching --shadow-card-hover in index.css) rather than a
        // `var(--...)` reference — framer-motion interpolates box-shadow by parsing its offset/
        // blur/color components, which it can't do through an opaque CSS custom-property string.
        hoverLift && !prefersReducedMotion
          ? { y: -4, boxShadow: '0 18px 40px -18px rgba(28, 20, 10, 0.28)' }
          : undefined
      }
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
