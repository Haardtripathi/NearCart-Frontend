import { useEffect, useState } from 'react'

import { getCustomerProfile, updateCustomerProfile } from '@/api/customer'
import { PageHeader } from '@/components/PageHeader'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/api'

interface ProfileFormValues {
  fullName: string
  phone: string
}

export function CustomerProfilePage() {
  const setUser = useAuthStore((state) => state.setUser)
  const [formValues, setFormValues] = useState<ProfileFormValues>({
    fullName: '',
    phone: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      try {
        const response = await getCustomerProfile()

        if (!isMounted) {
          return
        }

        setFormValues({
          fullName: response.item.user.fullName,
          phone: response.item.user.phone || '',
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setSubmitError(
          getApiErrorMessage(error, 'Unable to load your customer profile right now.'),
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
      const response = await updateCustomerProfile(formValues)

      setUser(response.item.user)
      setFormValues({
        fullName: response.item.user.fullName,
        phone: response.item.user.phone || '',
      })
      setSuccessMessage('Your profile was updated successfully.')
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Unable to save your customer profile right now.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingScreen message="Loading your customer profile..." />
  }

  return (
    <div className="space-y-6 animate-nk-fade-in">
      <div className="animate-nk-fade-slide-up">
        <PageHeader
          description="Update the identity details that NearKart uses across your dashboard and checkout experience."
          eyebrow="Customer profile"
          title="Profile settings"
        />
      </div>

      {/* Ring pulses once whenever a save just succeeded — the class flips off (setSuccessMessage(null))
          at the start of every submit and back on after the API call resolves, so each successful
          save re-triggers the animation, not just the first one. */}
      <div
        className={[
          'rounded-[1.75rem] animate-nk-fade-slide-up nk-stagger-1',
          successMessage ? 'animate-nk-pulse-ring' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <DashboardCard
          description="Your saved name and phone help checkout prefill faster when you place orders while signed in."
          title="Update your profile"
        >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Full name</span>
              <input
                className="field-input"
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
                className="field-input"
                onChange={(event) =>
                  setFormValues((currentState) => ({
                    ...currentState,
                    phone: event.target.value,
                  }))
                }
                value={formValues.phone}
              />
            </label>
          </div>

          {submitError ? (
            <div
              className="animate-nk-shake rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700"
              key={submitError}
            >
              {submitError}
            </div>
          ) : null}

          {successMessage ? (
            <div
              className="animate-nk-scale-in rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              key={successMessage}
            >
              {successMessage}
            </div>
          ) : null}

          <button
            className="inline-flex items-center justify-center rounded-full bg-nearkart-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-nearkart-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nearkart-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
        </DashboardCard>
      </div>
    </div>
  )
}
