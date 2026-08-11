import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { getApiErrorMessage } from '@/utils/api'
import { useAuthStore } from '@/store/authStore'

interface RegisterShopOwnerFormValues {
  fullName: string
  email: string
  phone: string
  password: string
  businessName: string
  gstNumber: string
}

const initialFormValues: RegisterShopOwnerFormValues = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  businessName: '',
  gstNumber: '',
}

function validate(values: RegisterShopOwnerFormValues) {
  const errors: Partial<Record<keyof RegisterShopOwnerFormValues, string>> = {}

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required.'
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  }

  if (!values.businessName.trim()) {
    errors.businessName = 'Business name is required.'
  }

  if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.'
  }

  return errors
}

export function RegisterShopOwnerPage() {
  const navigate = useNavigate()
  const registerShopOwner = useAuthStore((state) => state.registerShopOwner)
  const loading = useAuthStore((state) => state.loading)
  const [formValues, setFormValues] = useState(initialFormValues)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegisterShopOwnerFormValues, string>>
  >({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  function updateField<Key extends keyof RegisterShopOwnerFormValues>(
    field: Key,
    value: RegisterShopOwnerFormValues[Key],
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
      const user = await registerShopOwner({
        fullName: formValues.fullName,
        email: formValues.email,
        phone: formValues.phone.trim() || undefined,
        password: formValues.password,
        businessName: formValues.businessName,
        gstNumber: formValues.gstNumber.trim() || undefined,
      })
      navigate(
        `/verify-email?redirect=${encodeURIComponent(user.dashboardPath)}`,
        { replace: true },
      )
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Unable to create your shop owner account right now.'),
      )
    }
  }

  return (
    <AuthPageShell
      description="Launch your business on NearKart. Create an account to register your shops, manage products, and join our local commerce network."
      eyebrow="Merchant Portal"
      featurePoints={[
        'Shop Management: Register and manage multiple storefronts easily.',
        'Business Identity: Keep your business details and approval status in sync.',
        'Future-Ready: Stay ahead with upcoming inventory and order modules.',
      ]}
      featureTitle="Merchant Advantages"
      footerLabel="Sign in instead"
      footerPrompt="Already have a merchant account?"
      footerTo="/login"
      title="Start your workspace"
    >
      <div className="mb-7 space-y-1 lg:hidden">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-nearkart-600">Merchant Portal</p>
        <h2 className="font-display text-2xl font-bold text-ink-900">Start your workspace</h2>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          autoComplete="name"
          error={fieldErrors.fullName}
          id="fullName"
          label="Full name"
          onChange={(event) => updateField('fullName', event.target.value)}
          placeholder="Jane Smith"
          value={formValues.fullName}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            autoComplete="email"
            error={fieldErrors.email}
            id="email"
            label="Email address"
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="jane@business.com"
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
          error={fieldErrors.businessName}
          id="businessName"
          label="Business name"
          onChange={(event) => updateField('businessName', event.target.value)}
          placeholder="Acme Retail Solutions"
          value={formValues.businessName}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            hint="Optional"
            id="gstNumber"
            label="GST number"
            onChange={(event) => updateField('gstNumber', event.target.value)}
            placeholder="Optional"
            value={formValues.gstNumber}
          />

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
        </div>

        {submitError && (
          <div className="rounded-xl border border-accent-100 bg-accent-50 p-4 text-xs font-medium text-accent-700">
            {submitError}
          </div>
        )}

        <Button className="w-full" disabled={loading} isLoading={loading} loadingLabel="Creating workspace..." size="lg" type="submit">
          Create Merchant Workspace
        </Button>
      </form>
    </AuthPageShell>
  )
}
