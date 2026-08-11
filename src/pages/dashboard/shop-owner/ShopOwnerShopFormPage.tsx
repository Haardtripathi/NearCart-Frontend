import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  createShop,
  getShopOwnerShop,
  updateShop,
  updateShopTodayStatus,
  uploadShopLogo,
} from '@/api/shopOwner'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import {
  SHOP_FORM_STEPS,
  ShopBasicsFields,
  ShopFormStepIndicator,
  ShopHoursDeliveryFields,
  ShopLocationContactFields,
  ShopPhotoFields,
} from '@/components/dashboard/shop-owner/ShopFormSteps'
import type { PickedLocation } from '@/components/dashboard/shop-owner/ShopFormSteps'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import type { ManagedShop, ShopFormValues, ShopPayload } from '@/types/shop-owner'
import { getApiErrorMessage } from '@/utils/api'
import { formatDateTime } from '@/utils/formatDateTime'
import { getTodayStatusLabel, getTodayStatusTone } from '@/utils/shopAvailability'

// Matches the backend's default IMAGE_UPLOAD_MAX_BYTES (backend/src/config/env.ts) — kept as a
// literal here since the frontend has no runtime visibility into the backend's env config; if
// the backend default ever changes this should be updated to match.
const MAX_LOGO_UPLOAD_BYTES = 5 * 1024 * 1024

const initialFormValues: ShopFormValues = {
  name: '',
  description: '',
  logoImageUrl: '',
  category: '',
  phone: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  area: '',
  pincode: '',
  latitude: null,
  longitude: null,
  openingTime: '',
  closingTime: '',
  deliveryEnabled: true,
  minimumOrderAmount: 0,
  deliveryFeeDefault: 0,
  estimatedDeliveryMinutes: null,
  serviceRadiusKm: null,
  isActive: true,
}

function getFormValues(shop?: ManagedShop): ShopFormValues {
  if (!shop) {
    return initialFormValues
  }

  return {
    name: shop.name,
    description: shop.description || '',
    logoImageUrl: shop.logoImageUrl || '',
    category: shop.category,
    phone: shop.phone,
    email: shop.email || '',
    addressLine1: shop.addressLine1,
    addressLine2: shop.addressLine2 || '',
    city: shop.city,
    area: shop.area || '',
    pincode: shop.pincode,
    latitude: shop.latitude,
    longitude: shop.longitude,
    openingTime: shop.openingTime || '',
    closingTime: shop.closingTime || '',
    deliveryEnabled: shop.deliveryEnabled,
    minimumOrderAmount: shop.minimumOrderAmount,
    deliveryFeeDefault: shop.deliveryFeeDefault,
    estimatedDeliveryMinutes: shop.estimatedDeliveryMinutes,
    serviceRadiusKm: shop.serviceRadiusKm,
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
    logoImageUrl: values.logoImageUrl,
    category: values.category,
    phone: values.phone,
    email: values.email,
    addressLine1: values.addressLine1,
    addressLine2: values.addressLine2,
    city: values.city,
    area: values.area,
    pincode: values.pincode,
    latitude: values.latitude,
    longitude: values.longitude,
    openingTime: values.openingTime,
    closingTime: values.closingTime,
    deliveryEnabled: values.deliveryEnabled,
    minimumOrderAmount: values.minimumOrderAmount,
    deliveryFeeDefault: values.deliveryFeeDefault,
    estimatedDeliveryMinutes: values.estimatedDeliveryMinutes,
    serviceRadiusKm: values.serviceRadiusKm,
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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null)
  const [todayStatusReasonInput, setTodayStatusReasonInput] = useState('')
  const [isUpdatingTodayStatus, setIsUpdatingTodayStatus] = useState(false)
  const [todayStatusError, setTodayStatusError] = useState<string | null>(null)
  // Wizard state only used in create mode — an existing shop is edited as a single page (see
  // reasoning in the report: stepping through 4 screens to fix one field on an established shop
  // is friction, not help).
  const [currentStep, setCurrentStep] = useState(0)
  const isLastStep = currentStep === SHOP_FORM_STEPS.length - 1

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

  function handleLocationChange(location: PickedLocation) {
    setFormValues((currentState) => ({
      ...currentState,
      latitude: location.latitude,
      longitude: location.longitude,
      // Only fill in text fields the user hasn't already typed something into — the pin/search
      // result is a convenience prefill, not an override of manual edits. Same convention as
      // CustomerAddressesPage's handleLocationChange.
      addressLine1:
        currentState.addressLine1 ||
        location.formattedAddress ||
        currentState.addressLine1,
      city: currentState.city || location.addressComponents?.city || currentState.city,
      area: currentState.area || location.addressComponents?.area || currentState.area,
      pincode:
        currentState.pincode || location.addressComponents?.pincode || currentState.pincode,
    }))
    setFieldErrors((currentState) => ({
      ...currentState,
      addressLine1: undefined,
      city: undefined,
      pincode: undefined,
    }))
  }

  async function handleLogoFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !shopId) {
      return
    }

    // Mirror the backend's multer fileFilter (mimetype must start with "image/") and
    // IMAGE_UPLOAD_MAX_BYTES limit (default 5MB — see backend/src/config/env.ts and
    // backend/src/modules/uploads/uploads.routes.ts) client-side. Without this, picking a huge
    // or non-image file silently starts a slow upload that only fails after the full transfer,
    // instead of giving the user an instant, clear error.
    if (!file.type.startsWith('image/')) {
      setLogoUploadError('Only image files are supported.')
      return
    }

    if (file.size > MAX_LOGO_UPLOAD_BYTES) {
      setLogoUploadError(
        `Image must be smaller than ${Math.floor(MAX_LOGO_UPLOAD_BYTES / (1024 * 1024))}MB.`,
      )
      return
    }

    setLogoUploadError(null)
    setIsUploadingLogo(true)

    try {
      const response = await uploadShopLogo(shopId, file)

      updateField('logoImageUrl', response.item.url)
    } catch (error) {
      setLogoUploadError(
        getApiErrorMessage(error, 'Unable to upload this image right now.'),
      )
    } finally {
      setIsUploadingLogo(false)
    }
  }

  async function handleUpdateTodayStatus(isOpen: boolean) {
    if (!shopId) {
      return
    }

    setTodayStatusError(null)
    setIsUpdatingTodayStatus(true)

    try {
      const result = await updateShopTodayStatus(shopId, {
        isOpen,
        reason:
          !isOpen && todayStatusReasonInput.trim()
            ? todayStatusReasonInput.trim()
            : undefined,
      })

      setShop((currentShop) =>
        currentShop
          ? {
            ...currentShop,
            todayStatus: result.todayStatus,
            todayStatusReason: result.todayStatusReason,
            todayStatusUpdatedAt: result.todayStatusUpdatedAt,
          }
          : currentShop,
      )

      if (isOpen) {
        setTodayStatusReasonInput('')
      }
    } catch (error) {
      setTodayStatusError(
        getApiErrorMessage(error, "Unable to update today's status right now."),
      )
    } finally {
      setIsUpdatingTodayStatus(false)
    }
  }

  function handleNextStep() {
    const allErrors = validate(formValues)
    const stepFields = SHOP_FORM_STEPS[currentStep].fields
    const hasStepError = stepFields.some((field) => allErrors[field])

    // Only surface/clear errors for fields that belong to the step being left — steps further
    // ahead haven't been visited yet and shouldn't show errors prematurely.
    setFieldErrors((current) => {
      const next = { ...current }
      stepFields.forEach((field) => {
        next[field] = allErrors[field]
      })
      return next
    })

    if (hasStepError) {
      return
    }

    setCurrentStep((step) => Math.min(step + 1, SHOP_FORM_STEPS.length - 1))
  }

  function handleBackStep() {
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  function handleStepSelect(index: number) {
    // Jumping back to an already-visited step is fine; jumping ahead has to go through "Next"
    // so per-step validation can't be skipped.
    if (index <= currentStep) {
      setCurrentStep(index)
    }
  }

  async function submitShop() {
    const nextErrors = validate(formValues)
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      if (!isEditMode) {
        const firstErrorStepIndex = SHOP_FORM_STEPS.findIndex((step) =>
          step.fields.some((field) => nextErrors[field]),
        )

        if (firstErrorStepIndex !== -1) {
          setCurrentStep(firstErrorStepIndex)
        }
      }

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // In the create wizard, every step except the last submits by advancing instead of
    // saving — the actual create/update API call only ever fires from the final step.
    if (!isEditMode && !isLastStep) {
      handleNextStep()
      return
    }

    await submitShop()
  }

  if (isLoading) {
    return <LoadingScreen message="Loading your shop..." />
  }

  const currentStepDefinition = SHOP_FORM_STEPS[currentStep]

  return (
    <div className="space-y-6">
      <PageHeader
        description="Create a shop shell that admins can review now, while leaving room for future catalog, stock, and operational workflows."
        eyebrow="Shop configuration"
        title={shop ? shop.name : 'Create a new shop'}
      />

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardCard
          description={
            isEditMode
              ? 'Keep your merchant-facing shop details accurate so future storefront exposure, approvals, and operations can build on the same record.'
              : 'Set up your shop step by step — you can always come back and adjust any of these details later.'
          }
          title={shop ? 'Edit shop' : 'New shop'}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isEditMode ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Basics
                  </h3>
                  <ShopBasicsFields
                    fieldErrors={fieldErrors}
                    formValues={formValues}
                    updateField={updateField}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Location & contact
                  </h3>
                  <ShopLocationContactFields
                    fieldErrors={fieldErrors}
                    formValues={formValues}
                    onLocationChange={handleLocationChange}
                    updateField={updateField}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Photo
                  </h3>
                  <ShopPhotoFields
                    formValues={formValues}
                    isUploadingLogo={isUploadingLogo}
                    logoUploadError={logoUploadError}
                    onLogoFileChange={handleLogoFileChange}
                    shopId={shopId}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Hours & delivery
                  </h3>
                  <ShopHoursDeliveryFields
                    fieldErrors={fieldErrors}
                    formValues={formValues}
                    updateField={updateField}
                  />
                </div>
              </div>
            ) : (
              <>
                <ShopFormStepIndicator
                  currentStepIndex={currentStep}
                  onStepSelect={handleStepSelect}
                  steps={SHOP_FORM_STEPS}
                />

                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-lg text-ink-900">
                      {currentStepDefinition.label}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {currentStepDefinition.description}
                    </p>
                  </div>

                  {currentStep === 0 ? (
                    <ShopBasicsFields
                      fieldErrors={fieldErrors}
                      formValues={formValues}
                      updateField={updateField}
                    />
                  ) : null}

                  {currentStep === 1 ? (
                    <ShopLocationContactFields
                      fieldErrors={fieldErrors}
                      formValues={formValues}
                      onLocationChange={handleLocationChange}
                      updateField={updateField}
                    />
                  ) : null}

                  {currentStep === 2 ? (
                    <ShopPhotoFields
                      formValues={formValues}
                      isUploadingLogo={isUploadingLogo}
                      logoUploadError={logoUploadError}
                      onLogoFileChange={handleLogoFileChange}
                      shopId={shopId}
                    />
                  ) : null}

                  {currentStep === 3 ? (
                    <ShopHoursDeliveryFields
                      fieldErrors={fieldErrors}
                      formValues={formValues}
                      updateField={updateField}
                    />
                  ) : null}
                </div>
              </>
            )}

            {submitError ? (
              <div className="rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700">
                {submitError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {!isEditMode && currentStep > 0 ? (
                <button
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-nearkart-200 hover:text-nearkart-700"
                  onClick={handleBackStep}
                  type="button"
                >
                  Back
                </button>
              ) : null}

              <button
                className="inline-flex items-center justify-center rounded-full bg-nearkart-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-nearkart-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving
                  ? 'Saving...'
                  : isEditMode
                    ? 'Save shop changes'
                    : isLastStep
                      ? 'Create shop'
                      : 'Next'}
              </button>

              <Link
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-nearkart-200 hover:text-nearkart-700"
                to="/dashboard/shop-owner/shops"
              >
                Back to shops
              </Link>
            </div>
          </form>
        </DashboardCard>

        <div className="space-y-4">
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
                <StatusPill
                  label={shop.publicCatalogEnabled ? 'Public catalog on' : 'Public catalog off'}
                  tone={shop.publicCatalogEnabled ? 'success' : 'warning'}
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
                <p>
                  <span className="font-semibold text-ink-900">Inventory mapping:</span>{' '}
                  {shop.inventoryOrganizationId && shop.inventoryBranchId
                    ? 'Connected by admin'
                    : 'Pending admin mapping'}
                </p>
              </div>
              <div className="rounded-[1.35rem] bg-nearkart-50 px-4 py-4 text-sm leading-7 text-slate-600">
                Future catalog, stock, order handling, and service-area workflows can attach to this same shop record without a structural rewrite.
              </div>
            </div>
          ) : (
            <div className="rounded-[1.35rem] bg-slate-50 px-4 py-5 text-sm text-slate-600">
              Your new shop will appear here as soon as it is created.
            </div>
          )}
        </DashboardCard>

        {shop ? (
          <DashboardCard
            description="Tell customers whether you're taking orders today. This is separate from your regular opening hours and resets automatically — you'll need to confirm it again tomorrow."
            title="Today's status"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  label={getTodayStatusLabel(shop.todayStatus)}
                  tone={getTodayStatusTone(shop.todayStatus)}
                />
                {shop.todayStatus === 'CLOSED' && shop.todayStatusReason ? (
                  <span className="text-sm text-slate-500">
                    Reason: {shop.todayStatusReason}
                  </span>
                ) : null}
              </div>

              {shop.todayStatusUpdatedAt ? (
                <p className="text-xs text-slate-400">
                  Last updated {formatDateTime(shop.todayStatusUpdatedAt)}
                </p>
              ) : null}

              {todayStatusError ? (
                <div className="rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700">
                  {todayStatusError}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isUpdatingTodayStatus || shop.todayStatus === 'OPEN'}
                  onClick={() => void handleUpdateTodayStatus(true)}
                  type="button"
                >
                  Open today
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isUpdatingTodayStatus || shop.todayStatus === 'CLOSED'}
                  onClick={() => void handleUpdateTodayStatus(false)}
                  type="button"
                >
                  {isUpdatingTodayStatus ? 'Updating...' : 'Mark closed today'}
                </button>
              </div>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reason (optional, shown to customers when closed)
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-ink-900 outline-none transition focus:border-nearkart-300 focus:ring-2 focus:ring-nearkart-100"
                  onChange={(event) => setTodayStatusReasonInput(event.target.value)}
                  placeholder="e.g. Holiday, staff unavailable"
                  value={todayStatusReasonInput}
                />
              </label>

              <p className="text-xs italic text-slate-400">
                You&apos;ll need to confirm this again tomorrow — today&apos;s status resets daily.
              </p>
            </div>
          </DashboardCard>
        ) : null}
        </div>
      </section>
    </div>
  )
}
