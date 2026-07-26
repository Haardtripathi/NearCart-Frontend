import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { getApiErrorMessage } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'

interface RegisterCustomerFormValues {
  fullName: string
  email: string
  phone: string
  password: string
}

const initialFormValues: RegisterCustomerFormValues = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
}

function validate(values: RegisterCustomerFormValues) {
  const errors: Partial<Record<keyof RegisterCustomerFormValues, string>> = {}

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required.'
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  }

  if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.'
  }

  return errors
}

export function RegisterCustomerPage() {
  const navigate = useNavigate()
  const registerCustomer = useAuthStore((state) => state.registerCustomer)
  const loading = useAuthStore((state) => state.loading)
  const [formValues, setFormValues] = useState(initialFormValues)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegisterCustomerFormValues, string>>
  >({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  function updateField<Key extends keyof RegisterCustomerFormValues>(
    field: Key,
    value: RegisterCustomerFormValues[Key],
  ) {
    setFormValues((currentState) => ({
      ...currentState,
      [field]: value,
    }))
    setFieldErrors((currentState) => ({
      ...currentState,
      [field]: undefined,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validate(formValues)
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitError(null)

    try {
      const user = await registerCustomer({
        fullName: formValues.fullName,
        email: formValues.email,
        phone: formValues.phone.trim() || undefined,
        password: formValues.password,
      })
      navigate(user.dashboardPath, { replace: true })
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Unable to create your customer account right now.'),
      )
    }
  }

  return (
    <AuthPageShell
      description="Join our local commerce community to track your orders, save multiple delivery addresses, and enjoy a faster checkout experience."
      eyebrow="Join NearKart"
      featurePoints={[
        'Faster Checkout: Keep your address book ready for one-tap orders.',
        'Order History: View and track all your purchases from one dashboard.',
        'Direct Connection: Support local shops by ordering directly from them.',
      ]}
      featureTitle="Why Join Us?"
      footerLabel="Sign in instead"
      footerPrompt="Already have an account?"
      footerTo="/login"
      title="Create your account"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-400" htmlFor="fullName">
            Full name
          </label>
          <input
            className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
            id="fullName"
            onChange={(event) => updateField('fullName', event.target.value)}
            placeholder="John Doe"
            value={formValues.fullName}
          />
          {fieldErrors.fullName && (
            <p className="text-xs font-medium text-rose-500">{fieldErrors.fullName}</p>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-400" htmlFor="email">
              Email address
            </label>
            <input
              className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
              id="email"
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="john@example.com"
              type="email"
              value={formValues.email}
            />
            {fieldErrors.email && (
              <p className="text-xs font-medium text-rose-500">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-400" htmlFor="phone">
              Phone number
            </label>
            <input
              className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
              id="phone"
              onChange={(event) => updateField('phone', event.target.value)}
              placeholder="+91 00000 00000"
              value={formValues.phone}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-400" htmlFor="password">
            Password
          </label>
          <input
            className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
            id="password"
            onChange={(event) => updateField('password', event.target.value)}
            placeholder="At least 8 characters"
            type="password"
            value={formValues.password}
          />
          {fieldErrors.password && (
            <p className="text-xs font-medium text-rose-500">{fieldErrors.password}</p>
          )}
        </div>

        {submitError && (
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-xs font-medium text-rose-600">
            {submitError}
          </div>
        )}

        <button
          className="flex h-12 w-full items-center justify-center rounded-xl bg-ink-900 px-8 text-sm font-bold text-white shadow-lg transition hover:shadow-xl active:scale-95 disabled:grayscale disabled:opacity-50"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Creating account...' : 'Create My Account'}
        </button>
      </form>
    </AuthPageShell>
  )
}
