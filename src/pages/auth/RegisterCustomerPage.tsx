import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
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
      navigate(
        `/verify-email?redirect=${encodeURIComponent(user.dashboardPath)}`,
        { replace: true },
      )
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
      <div className="mb-7 space-y-1 lg:hidden">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-nearkart-600">Join NearKart</p>
        <h2 className="font-display text-2xl font-bold text-ink-900">Create your account</h2>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          autoComplete="name"
          error={fieldErrors.fullName}
          id="fullName"
          label="Full name"
          onChange={(event) => updateField('fullName', event.target.value)}
          placeholder="John Doe"
          value={formValues.fullName}
        />

        <div className="grid gap-5 sm:grid-cols-2">
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
            autoComplete="tel"
            hint="Optional"
            id="phone"
            label="Phone number"
            onChange={(event) => updateField('phone', event.target.value)}
            placeholder="+91 00000 00000"
            value={formValues.phone}
          />
        </div>

        <Input
          autoComplete="new-password"
          error={fieldErrors.password}
          id="password"
          label="Password"
          onChange={(event) => updateField('password', event.target.value)}
          placeholder="At least 8 characters"
          type="password"
          value={formValues.password}
        />

        {submitError && (
          <div className="rounded-xl border border-accent-100 bg-accent-50 p-4 text-xs font-medium text-accent-700">
            {submitError}
          </div>
        )}

        <Button className="w-full" disabled={loading} isLoading={loading} loadingLabel="Creating account..." size="lg" type="submit">
          Create My Account
        </Button>
      </form>
    </AuthPageShell>
  )
}
