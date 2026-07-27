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
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900">
      <div className="flex items-center gap-3">
        <span className="text-lg">✉️</span>
        <p className="font-medium">
          Please verify your email address. You can keep browsing, but you&apos;ll need to
          verify before checking out.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          className="inline-flex items-center justify-center rounded-full bg-amber-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-amber-800"
          to="/verify-email"
        >
          Verify now
        </Link>
        <button
          aria-label="Dismiss verification reminder"
          className="text-xs font-bold uppercase tracking-wider text-amber-700 transition hover:text-amber-900"
          onClick={() => setIsDismissed(true)}
          type="button"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
