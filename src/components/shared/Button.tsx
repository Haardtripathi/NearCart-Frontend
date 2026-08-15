import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
}

const variantClassNames: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
}

/**
 * Returns the same class string the `<Button>` component below applies, for callers that need a
 * button-styled element that isn't a native `<button>` (e.g. `react-router-dom`'s `<Link>`).
 * Keeping this as the single source of truth means every primary/secondary/danger/ghost action
 * across the app — button or link — renders identically.
 */
export function getButtonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
) {
  return [variantClassNames[variant], sizeClasses[size], className].filter(Boolean).join(' ')
}

// Omit the handful of native event names framer-motion's `motion.button` redefines for gesture
// tracking (drag/animation lifecycle) — a standard accommodation when spreading native button
// props onto a motion component, since `ButtonHTMLAttributes`'s versions of these are
// type-incompatible with framer-motion's.
type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
>

interface ButtonProps extends NativeButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  loadingLabel?: string
  icon?: ReactNode
}

/**
 * Spring-based press/hover feedback (`whileHover`/`whileTap`) replaces the old plain CSS
 * `active:scale-95` — every button in the app picks this up for free since `.btn` no longer
 * needs its own scale transition (kept as a fallback in index.css for non-Button elements using
 * `getButtonClassName` directly, e.g. `<Link>`s). Collapses to no motion under
 * `prefers-reduced-motion`, matching every other new animation in this pass.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingLabel,
  icon,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const prefersReducedMotion = useReducedMotion()
  const isDisabled = disabled || isLoading

  return (
    <motion.button
      className={getButtonClassName(variant, size, className)}
      disabled={isDisabled}
      whileHover={!isDisabled && !prefersReducedMotion ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled && !prefersReducedMotion ? { scale: 0.96 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      {...rest}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" />
      ) : (
        icon
      )}
      <span>{isLoading && loadingLabel ? loadingLabel : children}</span>
    </motion.button>
  )
}
