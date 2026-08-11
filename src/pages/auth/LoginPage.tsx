import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
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
      <div className="mb-7 space-y-1 lg:hidden animate-nk-fade-slide-up">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-nearkart-600">Welcome back</p>
        <h2 className="font-display text-2xl font-bold text-ink-900">Sign in to NearKart</h2>
      </div>

      <form className="space-y-5 animate-nk-fade-slide-up nk-stagger-1" onSubmit={handleSubmit}>
        <Input
          autoComplete="email"
          error={fieldErrors.email}
          id="email"
          label="Email address"
          onChange={(event) => updateField('email', event.target.value)}
          placeholder="john@example.com"
          type="email"
          value={formValues.email}
        />

        <Input
          autoComplete="current-password"
          error={fieldErrors.password}
          id="password"
          label="Password"
          onChange={(event) => updateField('password', event.target.value)}
          placeholder="••••••••"
          type="password"
          value={formValues.password}
        />

        {submitError && (
          <div
            className="animate-nk-shake rounded-xl border border-accent-100 bg-accent-50 p-4 text-xs font-medium text-accent-700"
            key={submitError}
          >
            {submitError}
          </div>
        )}

        <Button className="w-full" disabled={loading} isLoading={loading} loadingLabel="Signing in..." size="lg" type="submit">
          Sign in to Account
        </Button>
      </form>
    </AuthPageShell>
  )
}
