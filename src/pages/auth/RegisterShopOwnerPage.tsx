import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthPageShell } from '@/components/auth/AuthPageShell'
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
      const user = await registerShopOwner(formValues)
      navigate(user.dashboardPath, { replace: true })
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Unable to create your shop owner account right now.'),
      )
    }
  }

  return (
    <AuthPageShell
      description="Create a shop owner account to register shops, manage business details, and move through the NearKart approval flow."
      eyebrow="Shop owner account"
      featureDescription="This foundation gives merchants a real operating workspace now, while leaving room for future inventory, stock, and order operations."
      featurePoints={[
        'Set up business identity and keep approval status visible.',
        'Create and manage one or more shops from a protected dashboard.',
        'Stay ready for future product, stock, and order modules.',
      ]}
      featureTitle="What merchants can do"
      footerLabel="Sign in instead"
      footerPrompt="Already have a shop owner account?"
      footerTo="/login"
      title="Launch your NearKart merchant workspace."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="fullName">
            Full name
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
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
            <label className="text-sm font-medium text-slate-700" htmlFor="phone">
              Phone number
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
              id="phone"
              onChange={(event) => updateField('phone', event.target.value)}
              value={formValues.phone}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="businessName"
          >
            Business name
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
            id="businessName"
            onChange={(event) => updateField('businessName', event.target.value)}
            value={formValues.businessName}
          />
          {fieldErrors.businessName ? (
            <p className="text-sm text-rose-600">{fieldErrors.businessName}</p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="gstNumber"
            >
              GST number
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
              id="gstNumber"
              onChange={(event) => updateField('gstNumber', event.target.value)}
              value={formValues.gstNumber}
            />
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
          {loading ? 'Creating merchant account...' : 'Create shop owner account'}
        </button>
      </form>
    </AuthPageShell>
  )
}
