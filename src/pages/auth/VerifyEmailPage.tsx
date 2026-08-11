import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { sendEmailOtp, verifyEmailOtp } from '@/api/auth'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
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
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding)

  const [code, setCode] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [hasSentOnce, setHasSentOnce] = useState(false)
  const [sendNotice, setSendNotice] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const hasAutoSentRef = useRef(false)
  // Guards against a re-render race: setUser() below flips user.isVerified to true, and
  // because that store update and the navigate() call are both dispatched from inside the
  // same async handler (after an `await`), this component can still render one more time with
  // the now-verified user before the router has actually swapped away from this route. Without
  // this guard, the plain `if (user.isVerified) return <Navigate to={redirectTo} />` below fires
  // on that stray render and its effect-driven redirect wins the race against our own explicit
  // post-verify navigate() call — silently overriding the onboarding redirect with `redirectTo`
  // every time (this was invisible before onboarding existed, since both destinations used to
  // be the same URL). Set right before handleVerifySubmit takes over the redirect decision.
  const ownRedirectInFlightRef = useRef(false)

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

  if (user.isVerified && !ownRedirectInFlightRef.current) {
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

      ownRedirectInFlightRef.current = true
      setUser({ ...user!, isVerified: true })

      // First-time onboarding (welcome -> home address -> notifications) only ever runs right
      // after a customer's own successful verification, and only once per account (see
      // OnboardingPage.tsx / authStore's onboardingCompletedUserIds). Other roles and
      // already-onboarded customers skip straight to wherever they were headed.
      if (user!.role === 'CUSTOMER' && !hasCompletedOnboarding(user!.id)) {
        navigate('/onboarding', { replace: true })
      } else {
        navigate(redirectTo, { replace: true })
      }
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
      <div className="mb-7 space-y-1 lg:hidden animate-nk-fade-slide-up">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-nearkart-600">One more step</p>
        <h2 className="font-display text-2xl font-bold text-ink-900">Verify your email</h2>
      </div>

      <form className="space-y-5 animate-nk-fade-slide-up nk-stagger-1" onSubmit={handleVerifySubmit}>
        <Input
          autoComplete="one-time-code"
          className={[
            'text-center text-2xl font-bold tracking-[0.5em]',
            verifyError ? 'animate-nk-shake' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          error={verifyError ?? undefined}
          id="otp-code"
          inputMode="numeric"
          label="6-digit verification code"
          maxLength={6}
          onChange={(event) => {
            setCode(sanitizeCodeInput(event.target.value))
            setVerifyError(null)
          }}
          placeholder="000000"
          value={code}
        />

        {sendNotice && !verifyError && (
          <div className="animate-nk-fade-slide-up rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs font-medium text-emerald-700">
            {sendNotice}
          </div>
        )}

        {sendError && (
          <div className="animate-nk-fade-slide-up rounded-xl border border-accent-100 bg-accent-50 p-4 text-xs font-medium text-accent-700">
            {sendError}
          </div>
        )}

        <Button className="w-full" disabled={isVerifying || code.length !== 6} isLoading={isVerifying} loadingLabel="Verifying..." size="lg" type="submit">
          Verify email
        </Button>

        <Button
          className="w-full"
          disabled={isSending || (hasSentOnce && cooldownSeconds > 0)}
          isLoading={isSending}
          loadingLabel="Sending..."
          onClick={() => void requestCode()}
          type="button"
          variant="secondary"
        >
          {cooldownSeconds > 0
            ? `Resend code in ${cooldownSeconds}s`
            : hasSentOnce
              ? 'Resend code'
              : 'Send code'}
        </Button>
      </form>
    </AuthPageShell>
  )
}
