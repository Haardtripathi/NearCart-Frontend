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
 * Returns the same class string the `<Button>` component applies, for callers that need a
 * button-styled element that isn't a native `<button>` (e.g. `react-router-dom`'s `<Link>`).
 * Keeping this as the single source of truth means every primary/secondary/danger/ghost action
 * across the app — button or link — renders identically.
 *
 * Split out of Button.tsx (which only exports the `Button` component now) so Fast Refresh can
 * preserve component state on edit — `react-refresh/only-export-components` flags a component
 * file that also exports a plain function.
 */
export function getButtonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
) {
  return [variantClassNames[variant], sizeClasses[size], className].filter(Boolean).join(' ')
}
