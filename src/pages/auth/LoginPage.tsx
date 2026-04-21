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
      description="Sign in to manage orders, addresses, shops, and platform workflows with the right dashboard for your role."
      eyebrow="Welcome back"
      featureDescription="The NearKart foundation now supports role-aware sessions, dashboard access, and a path to real operations."
      featurePoints={[
        'Customers can manage addresses and track their own orders.',
        'Shop owners can create shops and watch approval progress.',
        'Admins can review platform users, shops, and orders.',
      ]}
      featureTitle="What unlocks after login"
      footerLabel="Create a customer account"
      footerPrompt="Need a NearKart account?"
      footerTo="/register/customer"
      title="Run your NearKart role from one secure login."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email address
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
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
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
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
          className="inline-flex w-full items-center justify-center rounded-full bg-nearkart-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-nearkart-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthPageShell>
  )
}
