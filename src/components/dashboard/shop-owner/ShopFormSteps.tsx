import type { ChangeEvent } from 'react'

import { AddressMapPicker } from '@/components/location/AddressMapPicker'
import type { PickedLocation } from '@/components/location/AddressMapPicker'
import type { ShopFormValues } from '@/types/shop-owner'

export type { PickedLocation }

export interface ShopFormStepDefinition {
  key: string
  label: string
  description: string
  // Fields validated (and gated on "Next") for this step. Steps with no required fields ([])
  // simply always let the user advance.
  fields: (keyof ShopFormValues)[]
}

export const SHOP_FORM_STEPS: ShopFormStepDefinition[] = [
  {
    key: 'basics',
    label: 'Basics',
    description: 'What is this shop called, and what does it sell?',
    fields: ['name', 'category'],
  },
  {
    key: 'location',
    label: 'Location & contact',
    description: 'Where customers will find you, and how to reach you.',
    fields: ['phone', 'addressLine1', 'city', 'pincode'],
  },
  {
    key: 'photo',
    label: 'Photo',
    description: 'A photo helps customers recognize your shop at a glance.',
    fields: [],
  },
  {
    key: 'hours',
    label: 'Hours & delivery',
    description: 'When you are open, and how delivery should work.',
    fields: [],
  },
]

type FieldErrors = Partial<Record<keyof ShopFormValues, string>>

type UpdateField = <Key extends keyof ShopFormValues>(
  field: Key,
  value: ShopFormValues[Key],
) => void

interface StepIndicatorProps {
  steps: ShopFormStepDefinition[]
  currentStepIndex: number
  onStepSelect: (index: number) => void
}

const inputClassName = 'field-input'

export function ShopFormStepIndicator({
  steps,
  currentStepIndex,
  onStepSelect,
}: StepIndicatorProps) {
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2">
      {steps.map((step, index) => {
        const isComplete = index < currentStepIndex
        const isCurrent = index === currentStepIndex
        // Only steps already reached are clickable — jumping forward should go through
        // "Next" so per-step validation can't be skipped.
        const isReachable = index <= currentStepIndex

        return (
          <li className="flex flex-1 items-center gap-1.5 sm:gap-2" key={step.key}>
            <button
              className={`flex w-full items-center gap-2 rounded-full border px-3 py-2 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nearkart-100 sm:text-sm ${
                isCurrent
                  ? 'border-nearkart-600 bg-nearkart-600 text-white'
                  : isComplete
                    ? 'border-nearkart-200 bg-nearkart-50 text-nearkart-700 hover:border-nearkart-300'
                    : 'border-slate-200 bg-white text-slate-400'
              } ${isReachable && !isCurrent ? 'cursor-pointer' : 'cursor-default'}`}
              disabled={!isReachable}
              onClick={() => onStepSelect(index)}
              type="button"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                  isCurrent
                    ? 'bg-white text-nearkart-700'
                    : isComplete
                      ? 'bg-nearkart-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isComplete ? '✓' : index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {index < steps.length - 1 ? (
              <span
                className={`h-px flex-1 ${
                  index < currentStepIndex ? 'bg-nearkart-300' : 'bg-slate-200'
                }`}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

interface StepFieldsProps {
  formValues: ShopFormValues
  fieldErrors: FieldErrors
  updateField: UpdateField
}

export function ShopBasicsFields({
  formValues,
  fieldErrors,
  updateField,
}: StepFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="field-label">Shop name</span>
          <input
            className={inputClassName}
            onChange={(event) => updateField('name', event.target.value)}
            value={formValues.name}
          />
          {fieldErrors.name ? (
            <span className="text-sm text-accent-600">{fieldErrors.name}</span>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="field-label">Category</span>
          <input
            className={inputClassName}
            onChange={(event) => updateField('category', event.target.value)}
            value={formValues.category}
          />
          {fieldErrors.category ? (
            <span className="text-sm text-accent-600">{fieldErrors.category}</span>
          ) : null}
        </label>
      </div>

      <label className="space-y-2">
        <span className="field-label">Description</span>
        <textarea
          className={`min-h-28 ${inputClassName}`}
          onChange={(event) => updateField('description', event.target.value)}
          value={formValues.description}
        />
      </label>
    </div>
  )
}

interface ShopLocationContactFieldsProps extends StepFieldsProps {
  onLocationChange: (location: PickedLocation) => void
}

export function ShopLocationContactFields({
  formValues,
  fieldErrors,
  updateField,
  onLocationChange,
}: ShopLocationContactFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="field-label">Phone</span>
          <input
            className={inputClassName}
            onChange={(event) => updateField('phone', event.target.value)}
            value={formValues.phone}
          />
          {fieldErrors.phone ? (
            <span className="text-sm text-accent-600">{fieldErrors.phone}</span>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="field-label">Email</span>
          <input
            className={inputClassName}
            onChange={(event) => updateField('email', event.target.value)}
            value={formValues.email}
          />
        </label>
      </div>

      <AddressMapPicker
        latitude={formValues.latitude}
        longitude={formValues.longitude}
        onLocationChange={onLocationChange}
      />

      <label className="space-y-2">
        <span className="field-label">Address line 1</span>
        <input
          className={inputClassName}
          onChange={(event) => updateField('addressLine1', event.target.value)}
          value={formValues.addressLine1}
        />
        {fieldErrors.addressLine1 ? (
          <span className="text-sm text-accent-600">{fieldErrors.addressLine1}</span>
        ) : null}
      </label>

      <label className="space-y-2">
        <span className="field-label">Address line 2</span>
        <input
          className={inputClassName}
          onChange={(event) => updateField('addressLine2', event.target.value)}
          value={formValues.addressLine2}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-2">
          <span className="field-label">City</span>
          <input
            className={inputClassName}
            onChange={(event) => updateField('city', event.target.value)}
            value={formValues.city}
          />
          {fieldErrors.city ? (
            <span className="text-sm text-accent-600">{fieldErrors.city}</span>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="field-label">Area</span>
          <input
            className={inputClassName}
            onChange={(event) => updateField('area', event.target.value)}
            value={formValues.area}
          />
        </label>

        <label className="space-y-2">
          <span className="field-label">Pincode</span>
          <input
            className={inputClassName}
            onChange={(event) => updateField('pincode', event.target.value)}
            value={formValues.pincode}
          />
          {fieldErrors.pincode ? (
            <span className="text-sm text-accent-600">{fieldErrors.pincode}</span>
          ) : null}
        </label>
      </div>
    </div>
  )
}

interface ShopPhotoFieldsProps {
  formValues: ShopFormValues
  shopId: string | undefined
  isUploadingLogo: boolean
  logoUploadError: string | null
  onLogoFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export function ShopPhotoFields({
  formValues,
  shopId,
  isUploadingLogo,
  logoUploadError,
  onLogoFileChange,
}: ShopPhotoFieldsProps) {
  return (
    <div className="space-y-2">
      <span className="field-label">Shop logo / photo</span>
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        {formValues.logoImageUrl ? (
          <img
            alt="Shop logo preview"
            className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
            src={formValues.logoImageUrl}
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
            No photo
          </div>
        )}

        <div className="flex-1 space-y-1">
          {/* `sr-only` (not `hidden`) keeps the native file input in the tab order so it's reachable
              by keyboard — a plain `display: none` input can never receive focus at all. The
              `peer-focus-visible:*` classes on the label give it the same brand-colored ring as
              every other focusable control once it's keyboard-focused. */}
          <label className="peer-focus-visible:ring-4 peer-focus-visible:ring-nearkart-100 inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-nearkart-200 hover:text-nearkart-700 aria-disabled:cursor-not-allowed aria-disabled:opacity-60">
            <input
              accept="image/*"
              aria-disabled={!shopId || isUploadingLogo}
              className="peer sr-only"
              disabled={!shopId || isUploadingLogo}
              onChange={onLogoFileChange}
              type="file"
            />
            {isUploadingLogo ? 'Uploading...' : 'Upload photo'}
          </label>
          {!shopId ? (
            <p className="text-xs text-slate-500">
              Create the shop first — once it exists you'll be able to come back and upload a
              real photo here.
            </p>
          ) : null}
          {logoUploadError ? (
            <p className="text-sm text-accent-600">{logoUploadError}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function ShopHoursDeliveryFields({ formValues, updateField }: StepFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="field-label">Opening time</span>
          <input
            className={inputClassName}
            onChange={(event) => updateField('openingTime', event.target.value)}
            placeholder="09:00"
            value={formValues.openingTime}
          />
        </label>

        <label className="space-y-2">
          <span className="field-label">Closing time</span>
          <input
            className={inputClassName}
            onChange={(event) => updateField('closingTime', event.target.value)}
            placeholder="21:00"
            value={formValues.closingTime}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="field-label">Minimum order amount</span>
          <input
            className={inputClassName}
            min={0}
            onChange={(event) =>
              updateField(
                'minimumOrderAmount',
                Number.parseInt(event.target.value || '0', 10),
              )
            }
            type="number"
            value={formValues.minimumOrderAmount}
          />
        </label>

        <label className="space-y-2">
          <span className="field-label">Default delivery fee</span>
          <input
            className={inputClassName}
            min={0}
            onChange={(event) =>
              updateField(
                'deliveryFeeDefault',
                Number.parseInt(event.target.value || '0', 10),
              )
            }
            type="number"
            value={formValues.deliveryFeeDefault}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="field-label">
            Estimated delivery minutes
          </span>
          <input
            className={inputClassName}
            min={0}
            onChange={(event) =>
              updateField(
                'estimatedDeliveryMinutes',
                event.target.value ? Number.parseInt(event.target.value, 10) : null,
              )
            }
            type="number"
            value={formValues.estimatedDeliveryMinutes ?? ''}
          />
        </label>

        <label className="space-y-2">
          <span className="field-label">Service radius (km)</span>
          <input
            className={inputClassName}
            min={0}
            onChange={(event) =>
              updateField(
                'serviceRadiusKm',
                event.target.value ? Number.parseFloat(event.target.value) : null,
              )
            }
            step="0.1"
            type="number"
            value={formValues.serviceRadiusKm ?? ''}
          />
        </label>
      </div>

      <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <input
          checked={formValues.deliveryEnabled}
          onChange={(event) => updateField('deliveryEnabled', event.target.checked)}
          type="checkbox"
        />
        <span>Enable delivery for the public storefront</span>
      </label>

      <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <input
          checked={formValues.isActive}
          onChange={(event) => updateField('isActive', event.target.checked)}
          type="checkbox"
        />
        <span>Shop is active and ready for future operations</span>
      </label>
    </div>
  )
}
