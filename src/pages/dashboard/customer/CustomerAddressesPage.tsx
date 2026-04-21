import { useEffect, useState } from 'react'

import {
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomerAddresses,
  updateCustomerAddress,
} from '@/api/customer'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import type { Address, AddressFormValues } from '@/types/customer'
import { getApiErrorMessage } from '@/utils/api'

const initialAddressForm: AddressFormValues = {
  label: '',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  area: '',
  pincode: '',
  landmark: '',
  isDefault: false,
}

function getAddressFormValues(address?: Address): AddressFormValues {
  if (!address) {
    return initialAddressForm
  }

  return {
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 || '',
    city: address.city,
    area: address.area || '',
    pincode: address.pincode,
    landmark: address.landmark || '',
    isDefault: address.isDefault,
  }
}

function validateAddress(values: AddressFormValues) {
  const errors: Partial<Record<keyof AddressFormValues, string>> = {}

  if (!values.label.trim()) {
    errors.label = 'Label is required.'
  }

  if (!values.fullName.trim()) {
    errors.fullName = 'Recipient name is required.'
  }

  if (!values.phone.trim()) {
    errors.phone = 'Phone number is required.'
  }

  if (!values.line1.trim()) {
    errors.line1 = 'Address line 1 is required.'
  }

  if (!values.city.trim()) {
    errors.city = 'City is required.'
  }

  if (!values.pincode.trim()) {
    errors.pincode = 'Pincode is required.'
  }

  return errors
}

export function CustomerAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [formValues, setFormValues] = useState<AddressFormValues>(initialAddressForm)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof AddressFormValues, string>>
  >({})
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function loadAddresses() {
    const response = await getCustomerAddresses()
    setAddresses(response.items)
  }

  useEffect(() => {
    let isMounted = true

    async function loadPage() {
      try {
        const response = await getCustomerAddresses()

        if (!isMounted) {
          return
        }

        setAddresses(response.items)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setSubmitError(
          getApiErrorMessage(error, 'Unable to load your saved addresses right now.'),
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadPage()

    return () => {
      isMounted = false
    }
  }, [])

  function resetForm() {
    setEditingAddressId(null)
    setFormValues(initialAddressForm)
    setFieldErrors({})
  }

  function startEditing(address: Address) {
    setEditingAddressId(address.id)
    setFormValues(getAddressFormValues(address))
    setFieldErrors({})
    setSuccessMessage(null)
    setSubmitError(null)
  }

  function updateField<Key extends keyof AddressFormValues>(
    field: Key,
    value: AddressFormValues[Key],
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

    const nextErrors = validateAddress(formValues)
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSaving(true)
    setSubmitError(null)
    setSuccessMessage(null)

    try {
      if (editingAddressId) {
        await updateCustomerAddress(editingAddressId, formValues)
        setSuccessMessage('Address updated successfully.')
      } else {
        await createCustomerAddress(formValues)
        setSuccessMessage('Address added successfully.')
      }

      await loadAddresses()
      resetForm()
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Unable to save your address right now.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(addressId: string) {
    const confirmed = window.confirm(
      'Delete this address from your NearKart account?',
    )

    if (!confirmed) {
      return
    }

    setSubmitError(null)
    setSuccessMessage(null)

    try {
      await deleteCustomerAddress(addressId)
      await loadAddresses()

      if (editingAddressId === addressId) {
        resetForm()
      }

      setSuccessMessage('Address deleted successfully.')
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Unable to delete this address right now.'),
      )
    }
  }

  if (isLoading) {
    return <LoadingScreen message="Loading your address book..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Save delivery addresses for faster checkout and keep one default address ready for future NearKart orders."
        eyebrow="Customer addresses"
        title="Address book"
      />

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardCard
          description="Create a new saved address or edit an existing one. Default addresses will prefill checkout when you are signed in."
          title={editingAddressId ? 'Edit address' : 'Add address'}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Label</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                  onChange={(event) => updateField('label', event.target.value)}
                  value={formValues.label}
                />
                {fieldErrors.label ? (
                  <span className="text-sm text-rose-600">{fieldErrors.label}</span>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Recipient name
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                  onChange={(event) =>
                    updateField('fullName', event.target.value)
                  }
                  value={formValues.fullName}
                />
                {fieldErrors.fullName ? (
                  <span className="text-sm text-rose-600">
                    {fieldErrors.fullName}
                  </span>
                ) : null}
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Phone number</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                onChange={(event) => updateField('phone', event.target.value)}
                value={formValues.phone}
              />
              {fieldErrors.phone ? (
                <span className="text-sm text-rose-600">{fieldErrors.phone}</span>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Address line 1
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                onChange={(event) => updateField('line1', event.target.value)}
                value={formValues.line1}
              />
              {fieldErrors.line1 ? (
                <span className="text-sm text-rose-600">{fieldErrors.line1}</span>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Address line 2
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                onChange={(event) => updateField('line2', event.target.value)}
                value={formValues.line2}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">City</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                  onChange={(event) => updateField('city', event.target.value)}
                  value={formValues.city}
                />
                {fieldErrors.city ? (
                  <span className="text-sm text-rose-600">{fieldErrors.city}</span>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Area</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                  onChange={(event) => updateField('area', event.target.value)}
                  value={formValues.area}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Pincode</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                  onChange={(event) =>
                    updateField('pincode', event.target.value)
                  }
                  value={formValues.pincode}
                />
                {fieldErrors.pincode ? (
                  <span className="text-sm text-rose-600">{fieldErrors.pincode}</span>
                ) : null}
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Landmark</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                onChange={(event) => updateField('landmark', event.target.value)}
                value={formValues.landmark}
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                checked={formValues.isDefault}
                onChange={(event) =>
                  updateField('isDefault', event.target.checked)
                }
                type="checkbox"
              />
              <span>Make this my default address</span>
            </label>

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

            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex items-center justify-center rounded-full bg-nearkart-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-nearkart-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving
                  ? 'Saving...'
                  : editingAddressId
                    ? 'Update address'
                    : 'Add address'}
              </button>
              {editingAddressId ? (
                <button
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-nearkart-200 hover:text-nearkart-700"
                  onClick={resetForm}
                  type="button"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </DashboardCard>

        <DashboardCard
          description="Use your saved addresses for quicker future checkout and keep one default ready for the public storefront flow."
          title="Saved addresses"
        >
          {addresses.length > 0 ? (
            <div className="space-y-3">
              {addresses.map((address) => (
                <article
                  key={address.id}
                  className="rounded-[1.35rem] border border-slate-100 bg-slate-50/80 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">{address.label}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {address.fullName} • {address.phone}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {address.isDefault ? (
                        <StatusPill label="Default" tone="success" />
                      ) : null}
                      <button
                        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-nearkart-200 hover:text-nearkart-700"
                        onClick={() => startEditing(address)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                        onClick={() => handleDelete(address.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ''}
                    <br />
                    {[address.area, address.city].filter(Boolean).join(', ')}
                    <br />
                    {address.pincode}
                    {address.landmark ? ` • ${address.landmark}` : ''}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.35rem] bg-slate-50 px-4 py-5 text-sm text-slate-600">
              No saved addresses yet. Add your first address to speed up future checkout.
            </div>
          )}
        </DashboardCard>
      </section>
    </div>
  )
}
