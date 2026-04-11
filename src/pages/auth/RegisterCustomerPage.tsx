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
      const user = await registerCustomer(formValues)
      navigate(user.dashboardPath, { replace: true })
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Unable to create your customer account right now.'),
      )
    }
  }

  return (
    <AuthPageShell
      description="Create a customer account to save addresses, get a personal dashboard, and keep your future NearCart orders connected to you."
      eyebrow="Customer account"
      featureDescription="The customer foundation is designed to stay compatible with the existing storefront while preparing for deeper account-based shopping."
      featurePoints={[
        'Keep your address book ready for faster checkout.',
        'View your own order history from a protected dashboard.',
        'Stay compatible with guest checkout while you transition to accounts.',
      ]}
      featureTitle="Why customers should sign up"
      footerLabel="Sign in instead"
      footerPrompt="Already have an account?"
      footerTo="/login"
      title="Create your NearCart customer account."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="fullName">
            Full name
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
            id="fullName"
            onChange={(event) => updateField('fullName', event.target.value)}
            value={formValues.fullName}
          />
          {fieldErrors.fullName ? (
            <p className="text-sm text-rose-600">{fieldErrors.fullName}</p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email address
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
              id="email"
              onChange={(event) => updateField('email', event.target.value)}
              type="email"
              value={formValues.email}
            />
            {fieldErrors.email ? (
              <p className="text-sm text-rose-600">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="phone">
              Phone number
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
              id="phone"
              onChange={(event) => updateField('phone', event.target.value)}
              value={formValues.phone}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
            id="password"
            onChange={(event) => updateField('password', event.target.value)}
            type="password"
            value={formValues.password}
          />
          {fieldErrors.password ? (
            <p className="text-sm text-rose-600">{fieldErrors.password}</p>
          ) : null}
        </div>

        {submitError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        <button
          className="inline-flex w-full items-center justify-center rounded-full bg-nearcart-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-nearcart-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Creating account...' : 'Create customer account'}
        </button>
      </form>
    </AuthPageShell>
  )
}
