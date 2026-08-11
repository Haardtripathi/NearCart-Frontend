import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'

/**
 * Persistent nudge shown while a logged-in user's email is unverified.
 * Dismissal is intentionally session/render-scoped (component state, not
 * persisted to localStorage) — it reappears on the next full navigation or
 * reload rather than being silenced forever, since staying unverified means
 * the user will still be blocked at checkout either way.
 */
export function VerifyEmailBanner() {
  const user = useAuthStore((state) => state.user)
  const [isDismissed, setIsDismissed] = useState(false)

  if (!user || user.isVerified || isDismissed) {
    return null
  }

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sun-200 bg-sun-50 px-6 py-4 text-sm text-sun-900 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm">✉️</span>
        <p className="font-medium leading-snug">
          Please verify your email address. You can keep browsing, but you&apos;ll need to
          verify before checking out.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Link className="btn-primary h-10 px-5 text-xs uppercase tracking-wider" to="/verify-email">
          Verify now
        </Link>
        <button
          aria-label="Dismiss verification reminder"
          className="text-xs font-bold uppercase tracking-wider text-sun-700 transition hover:text-sun-900"
          onClick={() => setIsDismissed(true)}
          type="button"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
