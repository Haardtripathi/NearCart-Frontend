import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { createCustomerAddress } from '@/api/customer'
import { AddressMapPicker } from '@/components/location/AddressMapPicker'
import type { PickedLocation } from '@/components/location/AddressMapPicker'
import type { AddressFormValues } from '@/types/customer'
import { getApiErrorMessage } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'

type OnboardingStep = 'welcome' | 'address' | 'notifications'

const STEPS: OnboardingStep[] = ['welcome', 'address', 'notifications']

function buildInitialAddressForm(fullName: string): AddressFormValues {
  return {
    label: 'Home',
    fullName,
    phone: '',
    line1: '',
    line2: '',
    city: '',
    area: '',
    pincode: '',
    // The backend (services/customer.service.ts's createCustomerAddress) always makes a
    // customer's very first address the default one regardless of this flag — it's set to
    // true here only so the checkbox reads correctly if we ever show it, not because the
    // server depends on it.
    isDefault: true,
    latitude: null,
    longitude: null,
  }
}

function StepDots({ current }: { current: OnboardingStep }) {
  const currentIndex = STEPS.indexOf(current)

  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, index) => (
        <span
          className={[
            'h-2 rounded-full transition-all',
            index === currentIndex ? 'w-8 bg-nearkart-600' : 'w-2 bg-ink-100',
          ].join(' ')}
          key={step}
        />
      ))}
    </div>
  )
}

function OnboardingShell({
  step,
  eyebrow,
  title,
  description,
  children,
}: {
  step: OnboardingStep
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center py-10">
      <div className="mb-8 space-y-6">
        <StepDots current={step} />
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-nearkart-600">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-ink-500">{description}</p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-ink-100 bg-white p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.35)] sm:p-8">
        {children}
      </div>
    </div>
  )
}

function WelcomeStep({ fullName, onNext }: { fullName: string; onNext: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <p className="text-sm leading-7 text-ink-600">
        Hi {fullName.split(' ')[0] || fullName}, welcome to NearKart! In just two quick steps
        we'll get your local shops set up and keep you posted on your orders.
      </p>
      <ul className="mx-auto max-w-sm space-y-3 text-left text-sm text-ink-600">
        <li className="flex items-start gap-3">
          <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-nearkart-100 text-center text-xs font-bold leading-5 text-nearkart-700">
            1
          </span>
          <span>Confirm your home address so we can show shops that actually deliver to you.</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-nearkart-100 text-center text-xs font-bold leading-5 text-nearkart-700">
            2
          </span>
          <span>Turn on notifications so you never miss an order update.</span>
        </li>
      </ul>
      <button
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-ink-900 px-8 text-sm font-bold text-white shadow-lg transition hover:shadow-xl active:scale-95 sm:w-auto"
        onClick={onNext}
        type="button"
      >
        Let's get started
      </button>
    </div>
  )
}

function AddressStep({
  fullName,
  onSaved,
  onSkip,
}: {
  fullName: string
  onSaved: () => void
  onSkip: () => void
}) {
  const [formValues, setFormValues] = useState<AddressFormValues>(() =>
    buildInitialAddressForm(fullName),
  )
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof AddressFormValues, string>>
  >({})
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function updateField<Key extends keyof AddressFormValues>(
    field: Key,
    value: AddressFormValues[Key],
  ) {
    setFormValues((currentState) => ({ ...currentState, [field]: value }))
    setFieldErrors((currentState) => ({ ...currentState, [field]: undefined }))
  }

  function handleLocationChange(location: PickedLocation) {
    setFormValues((currentState) => ({
      ...currentState,
      latitude: location.latitude,
      longitude: location.longitude,
      line1: currentState.line1 || location.formattedAddress || currentState.line1,
      city: currentState.city || location.addressComponents?.city || currentState.city,
      area: currentState.area || location.addressComponents?.area || currentState.area,
      pincode:
        currentState.pincode || location.addressComponents?.pincode || currentState.pincode,
    }))
    setFieldErrors((currentState) => ({
      ...currentState,
      line1: undefined,
      city: undefined,
      pincode: undefined,
    }))
  }

  function validate(values: AddressFormValues) {
    const errors: Partial<Record<keyof AddressFormValues, string>> = {}

    if (!values.fullName.trim()) errors.fullName = 'Recipient name is required.'
    if (!values.phone.trim()) errors.phone = 'Phone number is required.'
    if (!values.line1.trim()) errors.line1 = 'Address line 1 is required.'
    if (!values.city.trim()) errors.city = 'City is required.'
    if (!values.pincode.trim()) errors.pincode = 'Pincode is required.'

    return errors
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validate(formValues)
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSaving(true)
    setSubmitError(null)

    try {
      await createCustomerAddress(formValues)
      onSaved()
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Unable to save your address right now.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-xs font-medium text-ink-500">
        This becomes your default delivery address — it's also what NearKart uses to show shops
        near you, so a real address here matters more than it might look like.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Recipient name</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
            onChange={(event) => updateField('fullName', event.target.value)}
            value={formValues.fullName}
          />
          {fieldErrors.fullName ? (
            <span className="text-sm text-rose-600">{fieldErrors.fullName}</span>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Phone number</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
            onChange={(event) => updateField('phone', event.target.value)}
            value={formValues.phone}
          />
          {fieldErrors.phone ? (
            <span className="text-sm text-rose-600">{fieldErrors.phone}</span>
          ) : null}
        </label>
      </div>

      <AddressMapPicker
        latitude={formValues.latitude}
        longitude={formValues.longitude}
        onLocationChange={handleLocationChange}
      />

      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-700">Address line 1</span>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
          onChange={(event) => updateField('line1', event.target.value)}
          value={formValues.line1}
        />
        {fieldErrors.line1 ? (
          <span className="text-sm text-rose-600">{fieldErrors.line1}</span>
        ) : null}
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">City</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
            onChange={(event) => updateField('city', event.target.value)}
            value={formValues.city}
          />
          {fieldErrors.city ? (
            <span className="text-sm text-rose-600">{fieldErrors.city}</span>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Area</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
            onChange={(event) => updateField('area', event.target.value)}
            value={formValues.area}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Pincode</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
            onChange={(event) => updateField('pincode', event.target.value)}
            value={formValues.pincode}
          />
          {fieldErrors.pincode ? (
            <span className="text-sm text-rose-600">{fieldErrors.pincode}</span>
          ) : null}
        </label>
      </div>

      {submitError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          className="text-xs font-semibold uppercase tracking-wider text-ink-400 underline-offset-4 hover:text-ink-600 hover:underline"
          onClick={onSkip}
          type="button"
        >
          I'll add this later
        </button>
        <button
          className="inline-flex h-12 items-center justify-center rounded-xl bg-ink-900 px-8 text-sm font-bold text-white shadow-lg transition hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? 'Saving...' : 'Save address & continue'}
        </button>
      </div>
    </form>
  )
}

function NotificationsStep({ onFinish }: { onFinish: () => void }) {
  const browserSupportsNotifications = typeof window !== 'undefined' && 'Notification' in window
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    browserSupportsNotifications ? Notification.permission : 'unsupported',
  )
  const [isRequesting, setIsRequesting] = useState(false)

  async function handleEnable() {
    if (!browserSupportsNotifications) {
      return
    }

    setIsRequesting(true)

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="space-y-6 text-center">
      <p className="text-sm leading-7 text-ink-600">
        Get notified the moment a shop confirms your order, or when it's out for delivery. You
        can always change this later in your browser's site settings.
      </p>

      {!browserSupportsNotifications ? (
        <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4 text-xs font-medium text-ink-500">
          This browser doesn't support notification permission prompts — you can skip this step.
        </div>
      ) : permission === 'granted' ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs font-medium text-emerald-700">
          Notifications are on. You're all set.
        </div>
      ) : permission === 'denied' ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4 text-xs font-medium text-rose-600">
          Notifications are blocked for this site. You can re-enable them from your browser's
          address-bar site settings any time.
        </div>
      ) : (
        <button
          className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-nearkart-200 bg-nearkart-50 px-8 text-sm font-bold text-nearkart-700 transition hover:bg-nearkart-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          disabled={isRequesting}
          onClick={() => void handleEnable()}
          type="button"
        >
          {isRequesting ? 'Requesting...' : 'Enable notifications'}
        </button>
      )}

      <button
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-ink-900 px-8 text-sm font-bold text-white shadow-lg transition hover:shadow-xl active:scale-95 sm:w-auto"
        onClick={onFinish}
        type="button"
      >
        Continue to NearKart
      </button>
    </div>
  )
}

/**
 * First-time onboarding wizard, shown once right after a customer's email verification
 * succeeds (see VerifyEmailPage.tsx) and before they land on the normal home/shop-browsing
 * experience. "Once" is tracked per user id in the persisted auth store
 * (onboardingCompletedUserIds), not a single global flag, so a different account logging into
 * the same browser still gets it.
 *
 * Step 2 (address) intentionally reuses AddressMapPicker + createCustomerAddress exactly as
 * CustomerAddressesPage does, rather than a separate implementation — this is the address that
 * useCustomerCity() (src/hooks/useCustomerCity.ts) picks up as the customer's default address
 * on the very next page that calls it (HomePage/ShopsPage/SearchPage each call the hook fresh
 * on mount and always re-fetch /customer/addresses when authenticated, no stale-cache gate on
 * that path), which is what actually drives the city-based shop filtering.
 *
 * Step 3 (notifications) only requests the browser's own Notification permission. There is no
 * web-push subscription wiring (no service worker / VAPID key / push-subscription endpoint) —
 * that's a real gap, not something quietly skipped: the backend's
 * POST /api/customer/device-token expects an `expoPushToken`, which is mobile/Expo-specific and
 * has no browser equivalent here, so this step deliberately stops at the permission prompt.
 */
export function OnboardingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding)
  const markOnboardingComplete = useAuthStore((state) => state.markOnboardingComplete)
  const [step, setStep] = useState<OnboardingStep>('welcome')

  if (!user) {
    return null
  }

  // Belt-and-suspenders guard: someone navigating straight to /onboarding a second time (e.g.
  // via browser history) shouldn't see it replayed once it's already been completed for this
  // account.
  if (hasCompletedOnboarding(user.id)) {
    return <Navigate replace to="/" />
  }

  function finish() {
    markOnboardingComplete(user!.id)
    navigate('/', { replace: true })
  }

  return (
    <>
      {step === 'welcome' ? (
        <OnboardingShell
          description="A couple of quick things so NearKart works better for you from the very first order."
          eyebrow="Welcome to NearKart"
          step={step}
          title={`Welcome, ${user.fullName.split(' ')[0] || user.fullName}!`}
        >
          <WelcomeStep fullName={user.fullName} onNext={() => setStep('address')} />
        </OnboardingShell>
      ) : null}

      {step === 'address' ? (
        <OnboardingShell
          description="Shops near this address will show up first when you browse or search."
          eyebrow="Step 1 of 2"
          step={step}
          title="Where should we deliver?"
        >
          <AddressStep
            fullName={user.fullName}
            onSaved={() => setStep('notifications')}
            onSkip={() => setStep('notifications')}
          />
        </OnboardingShell>
      ) : null}

      {step === 'notifications' ? (
        <OnboardingShell
          description="Order confirmations and delivery updates, right when they happen."
          eyebrow="Step 2 of 2"
          step={step}
          title="Stay in the loop"
        >
          <NotificationsStep onFinish={finish} />
        </OnboardingShell>
      ) : null}
    </>
  )
}
