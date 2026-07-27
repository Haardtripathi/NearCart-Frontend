import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { sendEmailOtp, verifyEmailOtp } from '@/api/auth'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { useAuthStore } from '@/store/authStore'
import {
  getApiErrorMessage,
  getApiErrorRetryAfterSeconds,
} from '@/utils/api'

function sanitizeCodeInput(rawValue: string): string {
  return rawValue.replace(/\D/g, '').slice(0, 6)
}

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  const [code, setCode] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [hasSentOnce, setHasSentOnce] = useState(false)
  const [sendNotice, setSendNotice] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const hasAutoSentRef = useRef(false)

  const redirectTo = searchParams.get('redirect') || user?.dashboardPath || '/'

  const requestCode = useCallback(async () => {
    setIsSending(true)
    setSendError(null)

    try {
      const response = await sendEmailOtp()

      setHasSentOnce(true)
      setCooldownSeconds(response.cooldownSeconds)
      setSendNotice(response.message)
      setVerifyError(null)
      setCode('')
    } catch (error) {
      const retryAfterSeconds = getApiErrorRetryAfterSeconds(error)

      if (retryAfterSeconds !== null) {
        setHasSentOnce(true)
        setCooldownSeconds(retryAfterSeconds)
      }

      setSendError(
        getApiErrorMessage(error, 'Unable to send a verification code right now.'),
      )
    } finally {
      setIsSending(false)
    }
  }, [])

  // Fire off a code automatically the first time this screen is reached
  // (e.g. right after registration) so the user doesn't have to click
  // anything before checking their inbox. Guarded by a ref (not just state)
  // so React 18 StrictMode's double-invoke of effects in dev can't fire the
  // request twice and trip the resend cooldown.
  useEffect(() => {
    if (!user || user.isVerified || hasAutoSentRef.current) {
      return
    }

    hasAutoSentRef.current = true
    void requestCode()
  }, [user, requestCode])

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cooldownSeconds])

  if (!user) {
    return null
  }

  if (user.isVerified) {
    return <Navigate replace to={redirectTo} />
  }

  async function handleVerifySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!/^\d{6}$/.test(code)) {
      setVerifyError('Enter the 6-digit code from your email.')
      return
    }

    setIsVerifying(true)
    setVerifyError(null)

    try {
      await verifyEmailOtp(code)

      setUser({ ...user!, isVerified: true })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setVerifyError(
        getApiErrorMessage(error, 'Unable to verify that code right now.'),
      )
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <AuthPageShell
      description="We use a one-time code to confirm this email address really belongs to you, so order updates and receipts always land in the right inbox."
      eyebrow="One more step"
      featurePoints={[
        `A 6-digit code was sent to ${user.email}.`,
        'Codes expire after a short window — request a fresh one any time.',
        "You can keep browsing and shopping while you're unverified — just verify before checkout.",
      ]}
      featureTitle="Why verify?"
      footerLabel="Skip for now"
      footerPrompt="Not ready to verify?"
      footerTo={redirectTo}
      title="Verify your email"
    >
      <form className="space-y-6" onSubmit={handleVerifySubmit}>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-400" htmlFor="otp-code">
            6-digit verification code
          </label>
          <input
            autoComplete="one-time-code"
            className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-center text-2xl font-bold tracking-[0.5em] text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
            id="otp-code"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => {
              setCode(sanitizeCodeInput(event.target.value))
              setVerifyError(null)
            }}
            placeholder="000000"
            value={code}
          />
          {verifyError && (
            <p className="text-xs font-medium text-rose-500">{verifyError}</p>
          )}
        </div>

        {sendNotice && !verifyError && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs font-medium text-emerald-700">
            {sendNotice}
          </div>
        )}

        {sendError && (
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-xs font-medium text-rose-600">
            {sendError}
          </div>
        )}

        <button
          className="flex h-12 w-full items-center justify-center rounded-xl bg-ink-900 px-8 text-sm font-bold text-white shadow-lg transition hover:shadow-xl active:scale-95 disabled:grayscale disabled:opacity-50"
          disabled={isVerifying || code.length !== 6}
          type="submit"
        >
          {isVerifying ? 'Verifying...' : 'Verify email'}
        </button>

        <button
          className="flex h-11 w-full items-center justify-center rounded-xl border border-ink-100 bg-white px-8 text-xs font-bold uppercase tracking-wider text-ink-600 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSending || (hasSentOnce && cooldownSeconds > 0)}
          onClick={() => void requestCode()}
          type="button"
        >
          {isSending
            ? 'Sending...'
            : cooldownSeconds > 0
              ? `Resend code in ${cooldownSeconds}s`
              : hasSentOnce
                ? 'Resend code'
                : 'Send code'}
        </button>
      </form>
    </AuthPageShell>
  )
}
