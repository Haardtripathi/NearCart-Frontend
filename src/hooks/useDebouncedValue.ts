import { useEffect, useState } from 'react'

/**
 * Generic debounce hook — returns `value` only after it has stopped changing for `delayMs`.
 * Used by the header search dropdown / search page so we don't fire an API call on every
 * keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [value, delayMs])

  return debouncedValue
}
