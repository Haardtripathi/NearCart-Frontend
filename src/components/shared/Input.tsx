import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

interface FieldWrapperProps {
  label?: string
  hint?: string
  error?: string
  children: ReactNode
}

function FieldWrapper({ label, hint, error, children }: FieldWrapperProps) {
  return (
    <label className="block space-y-2">
      {label ? <span className="field-label">{label}</span> : null}
      {children}
      {error ? (
        <span className="block text-xs font-medium text-accent-600">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-ink-400">{hint}</span>
      ) : null}
    </label>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

/**
 * Shared text input — every form field across the app should render through this (or
 * `Textarea`/`Select` below) so borders, radius, focus rings, and error styling stay identical
 * from one source instead of the long ad-hoc class strings previously duplicated per page.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className = '', ...rest },
  ref,
) {
  return (
    <FieldWrapper error={error} hint={hint} label={label}>
      <input
        ref={ref}
        className={[
          'field-input',
          error ? 'border-accent-400 focus:border-accent-400 focus:ring-accent-100' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
    </FieldWrapper>
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className = '', ...rest },
  ref,
) {
  return (
    <FieldWrapper error={error} hint={hint} label={label}>
      <textarea
        ref={ref}
        className={['field-input', 'min-h-28 resize-y', className].filter(Boolean).join(' ')}
        {...rest}
      />
    </FieldWrapper>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className = '', children, ...rest },
  ref,
) {
  return (
    <FieldWrapper error={error} hint={hint} label={label}>
      <select ref={ref} className={['field-input', className].filter(Boolean).join(' ')} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  )
})
