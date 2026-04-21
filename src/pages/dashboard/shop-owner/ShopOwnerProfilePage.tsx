import { useEffect, useState } from 'react'

import { getShopOwnerProfile, updateShopOwnerProfile } from '@/api/shopOwner'
import { PageHeader } from '@/components/PageHeader'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/api'

interface ProfileFormValues {
  fullName: string
  phone: string
  businessName: string
  gstNumber: string
}

export function ShopOwnerProfilePage() {
  const setUser = useAuthStore((state) => state.setUser)
  const [formValues, setFormValues] = useState<ProfileFormValues>({
    fullName: '',
    phone: '',
    businessName: '',
    gstNumber: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      try {
        const response = await getShopOwnerProfile()

        if (!isMounted) {
          return
        }

        setFormValues({
          fullName: response.item.user.fullName,
          phone: response.item.user.phone || '',
          businessName: response.item.profile.businessName,
          gstNumber: response.item.profile.gstNumber || '',
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setSubmitError(
          getApiErrorMessage(error, 'Unable to load your merchant profile right now.'),
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setSuccessMessage(null)
    setIsSaving(true)

    try {
      const response = await updateShopOwnerProfile(formValues)
      setUser(response.item.user)
      setFormValues({
        fullName: response.item.user.fullName,
        phone: response.item.user.phone || '',
        businessName: response.item.profile.businessName,
        gstNumber: response.item.profile.gstNumber || '',
      })
      setSuccessMessage('Your merchant profile was updated successfully.')
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Unable to save your merchant profile right now.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingScreen message="Loading your merchant profile..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Update the business identity and owner details that power your NearKart merchant workspace."
        eyebrow="Shop owner profile"
        title="Merchant profile settings"
      />

      <DashboardCard
        description="These details help NearKart keep your merchant account and shop records aligned for future operations."
        title="Update merchant profile"
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Full name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                onChange={(event) =>
                  setFormValues((currentState) => ({
                    ...currentState,
                    fullName: event.target.value,
                  }))
                }
                value={formValues.fullName}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Phone number</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                onChange={(event) =>
                  setFormValues((currentState) => ({
                    ...currentState,
                    phone: event.target.value,
                  }))
                }
                value={formValues.phone}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Business name
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                onChange={(event) =>
                  setFormValues((currentState) => ({
                    ...currentState,
                    businessName: event.target.value,
                  }))
                }
                value={formValues.businessName}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">GST number</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                onChange={(event) =>
                  setFormValues((currentState) => ({
                    ...currentState,
                    gstNumber: event.target.value,
                  }))
                }
                value={formValues.gstNumber}
              />
            </label>
          </div>

          {submitError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {submitError}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <button
            className="inline-flex items-center justify-center rounded-full bg-nearkart-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-nearkart-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </DashboardCard>
    </div>
  )
}
