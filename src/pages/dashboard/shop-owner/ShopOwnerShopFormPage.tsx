import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { createShop, getShopOwnerShop, updateShop } from '@/api/shopOwner'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import type { ManagedShop, ShopFormValues, ShopPayload } from '@/types/shop-owner'
import { getApiErrorMessage } from '@/utils/api'

const initialFormValues: ShopFormValues = {
  name: '',
  description: '',
  category: '',
  phone: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  area: '',
  pincode: '',
  openingTime: '',
  closingTime: '',
  isActive: true,
}

function getFormValues(shop?: ManagedShop): ShopFormValues {
  if (!shop) {
    return initialFormValues
  }

  return {
    name: shop.name,
    description: shop.description || '',
    category: shop.category,
    phone: shop.phone,
    email: shop.email || '',
    addressLine1: shop.addressLine1,
    addressLine2: shop.addressLine2 || '',
    city: shop.city,
    area: shop.area || '',
    pincode: shop.pincode,
    openingTime: shop.openingTime || '',
    closingTime: shop.closingTime || '',
    isActive: shop.isActive,
  }
}

function validate(values: ShopFormValues) {
  const errors: Partial<Record<keyof ShopFormValues, string>> = {}

  if (!values.name.trim()) {
    errors.name = 'Shop name is required.'
  }

  if (!values.category.trim()) {
    errors.category = 'Category is required.'
  }

  if (!values.phone.trim()) {
    errors.phone = 'Phone number is required.'
  }

  if (!values.addressLine1.trim()) {
    errors.addressLine1 = 'Address line 1 is required.'
  }

  if (!values.city.trim()) {
    errors.city = 'City is required.'
  }

  if (!values.pincode.trim()) {
    errors.pincode = 'Pincode is required.'
  }

  return errors
}

function buildPayload(values: ShopFormValues): ShopPayload {
  return {
    name: values.name,
    description: values.description,
    category: values.category,
    phone: values.phone,
    email: values.email,
    addressLine1: values.addressLine1,
    addressLine2: values.addressLine2,
    city: values.city,
    area: values.area,
    pincode: values.pincode,
    openingTime: values.openingTime,
    closingTime: values.closingTime,
    isActive: values.isActive,
  }
}

function getApprovalTone(status: ManagedShop['approvalStatus']) {
  switch (status) {
    case 'APPROVED':
      return 'success' as const
    case 'REJECTED':
      return 'danger' as const
    case 'PENDING':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

export function ShopOwnerShopFormPage() {
  const navigate = useNavigate()
  const { shopId } = useParams()
  const isEditMode = Boolean(shopId)
  const [shop, setShop] = useState<ManagedShop | null>(null)
  const [formValues, setFormValues] = useState<ShopFormValues>(initialFormValues)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ShopFormValues, string>>
  >({})
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadShop() {
      if (!shopId) {
        return
      }

      try {
        const response = await getShopOwnerShop(shopId)

        if (!isMounted) {
          return
        }

        setShop(response.item)
        setFormValues(getFormValues(response.item))
      } catch (error) {
        if (!isMounted) {
          return
        }

        setSubmitError(
          getApiErrorMessage(error, 'Unable to load this shop right now.'),
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadShop()

    return () => {
      isMounted = false
    }
  }, [shopId])

  function updateField<Key extends keyof ShopFormValues>(
    field: Key,
    value: ShopFormValues[Key],
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
    setSuccessMessage(null)
    setIsSaving(true)

    try {
      const payload = buildPayload(formValues)
      const response =
        shopId != null
          ? await updateShop(shopId, payload)
          : await createShop(payload)

      setShop(response.item)
      setFormValues(getFormValues(response.item))
      setSuccessMessage(
        shopId
          ? 'Shop details updated successfully.'
          : 'Shop created successfully.',
      )

      if (!shopId) {
        navigate(`/dashboard/shop-owner/shops/${response.item.id}`, {
          replace: true,
        })
      }
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Unable to save this shop right now.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingScreen message="Loading your shop..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Create a shop shell that admins can review now, while leaving room for future catalog, stock, and operational workflows."
        eyebrow="Shop configuration"
        title={shop ? shop.name : 'Create a new shop'}
      />

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardCard
          description="Keep your merchant-facing shop details accurate so future storefront exposure, approvals, and operations can build on the same record."
          title={shop ? 'Edit shop' : 'New shop'}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Shop name</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                  onChange={(event) => updateField('name', event.target.value)}
                  value={formValues.name}
                />
                {fieldErrors.name ? (
                  <span className="text-sm text-rose-600">{fieldErrors.name}</span>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Category</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                  onChange={(event) =>
                    updateField('category', event.target.value)
                  }
                  value={formValues.category}
                />
                {fieldErrors.category ? (
                  <span className="text-sm text-rose-600">
                    {fieldErrors.category}
                  </span>
                ) : null}
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Description
              </span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                value={formValues.description}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Phone</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                  onChange={(event) => updateField('phone', event.target.value)}
                  value={formValues.phone}
                />
                {fieldErrors.phone ? (
                  <span className="text-sm text-rose-600">{fieldErrors.phone}</span>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                  onChange={(event) => updateField('email', event.target.value)}
                  value={formValues.email}
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Address line 1
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                onChange={(event) =>
                  updateField('addressLine1', event.target.value)
                }
                value={formValues.addressLine1}
              />
              {fieldErrors.addressLine1 ? (
                <span className="text-sm text-rose-600">
                  {fieldErrors.addressLine1}
                </span>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Address line 2
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                onChange={(event) =>
                  updateField('addressLine2', event.target.value)
                }
                value={formValues.addressLine2}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">City</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                  onChange={(event) => updateField('area', event.target.value)}
                  value={formValues.area}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Pincode</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Opening time
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                  onChange={(event) =>
                    updateField('openingTime', event.target.value)
                  }
                  placeholder="09:00"
                  value={formValues.openingTime}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Closing time
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                  onChange={(event) =>
                    updateField('closingTime', event.target.value)
                  }
                  placeholder="21:00"
                  value={formValues.closingTime}
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                checked={formValues.isActive}
                onChange={(event) => updateField('isActive', event.target.checked)}
                type="checkbox"
              />
              <span>Shop is active and ready for future operations</span>
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
                className="inline-flex items-center justify-center rounded-full bg-nearcart-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-nearcart-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving
                  ? 'Saving...'
                  : shop
                    ? 'Save shop changes'
                    : 'Create shop'}
              </button>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-nearcart-200 hover:text-nearcart-700"
                to="/dashboard/shop-owner/shops"
              >
                Back to shops
              </Link>
            </div>
          </form>
        </DashboardCard>

        <DashboardCard
          description="Approval and identity details for this shop. Admin review happens from the platform dashboard."
          title="Shop status"
        >
          {shop ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  label={shop.approvalStatus}
                  tone={getApprovalTone(shop.approvalStatus)}
                />
                <StatusPill
                  label={shop.isActive ? 'Active' : 'Inactive'}
                  tone={shop.isActive ? 'success' : 'neutral'}
                />
              </div>
              <div className="rounded-[1.35rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                <p>
                  <span className="font-semibold text-ink-900">Slug:</span>{' '}
                  {shop.slug}
                </p>
                <p>
                  <span className="font-semibold text-ink-900">Location:</span>{' '}
                  {[shop.area, shop.city].filter(Boolean).join(', ')}
                </p>
                <p>
                  <span className="font-semibold text-ink-900">Address:</span>{' '}
                  {shop.addressLine1}
                  {shop.addressLine2 ? `, ${shop.addressLine2}` : ''}
                </p>
              </div>
              <div className="rounded-[1.35rem] bg-nearcart-50 px-4 py-4 text-sm leading-7 text-slate-600">
                Future catalog, stock, order handling, and service-area workflows can attach to this same shop record without a structural rewrite.
              </div>
            </div>
          ) : (
            <div className="rounded-[1.35rem] bg-slate-50 px-4 py-5 text-sm text-slate-600">
              Your new shop will appear here as soon as it is created.
            </div>
          )}
        </DashboardCard>
      </section>
    </div>
  )
}
