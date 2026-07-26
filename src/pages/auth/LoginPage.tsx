import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { getApiErrorMessage } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'

interface LoginFormValues {
  email: string
  password: string
}

const initialFormValues: LoginFormValues = {
  email: '',
  password: '',
}

function validate(values: LoginFormValues) {
  const errors: Partial<Record<keyof LoginFormValues, string>> = {}

  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  }

  if (!values.password) {
    errors.password = 'Password is required.'
  }

  return errors
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const loading = useAuthStore((state) => state.loading)
  const [formValues, setFormValues] = useState(initialFormValues)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginFormValues, string>>
  >({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  function updateField<Key extends keyof LoginFormValues>(
    field: Key,
    value: LoginFormValues[Key],
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
      const user = await login(formValues)
      const redirectTo = searchParams.get('redirect')

      navigate(redirectTo || user.dashboardPath, { replace: true })
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Unable to sign you in right now.'))
    }
  }

  return (
    <AuthPageShell
      description="Access your personalized NearKart dashboard to manage your shopping, shop operations, or platform administration."
      eyebrow="Welcome back"
      featurePoints={[
        'Customers: Track orders and manage your saved delivery addresses.',
        'Shop Owners: Manage your product catalog and monitor live order flow.',
        'Admins: Oversee platform activity, shop approvals, and user accounts.',
      ]}
      featureTitle="Everything in sync"
      footerLabel="Create a customer account"
      footerPrompt="New to NearKart?"
      footerTo="/register/customer"
      title="Access your Commerce OS"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-400" htmlFor="password">
              Password
            </label>
          </div>
          <input
            className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
            id="password"
            onChange={(event) => updateField('password', event.target.value)}
            placeholder="••••••••"
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
          {loading ? 'Signing in...' : 'Sign in to Account'}
        </button>
      </form>
    </AuthPageShell>
  )
}
