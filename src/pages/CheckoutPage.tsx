import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

import { getCustomerAddresses, getCustomerProfile } from '@/api/customer'
import { createOrder } from '@/api/orders'
import { PageHeader } from '@/components/PageHeader'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import type { Address } from '@/types/customer'
import type { CheckoutFormValues } from '@/types/order'
import { getApiErrorMessage } from '@/utils/api'
import { formatCurrency } from '@/utils/formatCurrency'
import { addGuestOrderId } from '@/utils/guestOrders'

const initialFormValues: CheckoutFormValues = {
  addressId: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  deliveryAddressLine1: '',
  deliveryAddressLine2: '',
  city: '',
  area: '',
  pincode: '',
  landmark: '',
  notes: '',
  paymentMethod: 'COD',
}

function validateCheckoutForm(values: CheckoutFormValues) {
  const errors: Partial<Record<keyof CheckoutFormValues, string>> = {}

  if (!values.customerName.trim()) {
    errors.customerName = 'Full name is required.'
  }

  if (!values.customerPhone.trim()) {
    errors.customerPhone = 'Phone number is required.'
  }

  if (values.customerEmail.trim() && !/\S+@\S+\.\S+/.test(values.customerEmail)) {
    errors.customerEmail = 'Enter a valid email address.'
  }

  if (!values.deliveryAddressLine1.trim()) {
    errors.deliveryAddressLine1 = 'Address line 1 is required.'
  }

  if (!values.city.trim()) {
    errors.city = 'City is required.'
  }

  if (!values.pincode.trim()) {
    errors.pincode = 'Pincode is required.'
  }

  if (!values.paymentMethod) {
    errors.paymentMethod = 'Select a payment method.'
  }

  return errors
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { shopId, shopName, items, getCartCount, getCartSubtotal, clearCart } =
    useCartStore((state) => state)
  const [formValues, setFormValues] =
    useState<CheckoutFormValues>(initialFormValues)
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CheckoutFormValues, string>>
  >({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasItems = items.length > 0
  const subtotal = getCartSubtotal()
  const cartCount = getCartCount()

  useEffect(() => {
    let isMounted = true

    async function loadCustomerContext() {
      if (user?.role !== 'CUSTOMER') {
        return
      }

      try {
        const [profileResponse, addressesResponse] = await Promise.all([
          getCustomerProfile(),
          getCustomerAddresses(),
        ])

        if (!isMounted) {
          return
        }

        const defaultAddress =
          profileResponse.item.profile.defaultAddress ||
          addressesResponse.items.find((address) => address.isDefault) ||
          null

        setSavedAddresses(addressesResponse.items)
        setFormValues((currentState) => ({
          ...currentState,
          addressId: defaultAddress?.id || currentState.addressId,
          customerName: currentState.customerName || profileResponse.item.user.fullName,
          customerPhone:
            currentState.customerPhone || profileResponse.item.user.phone || '',
          customerEmail: currentState.customerEmail || profileResponse.item.user.email,
          deliveryAddressLine1:
            currentState.deliveryAddressLine1 || defaultAddress?.line1 || '',
          deliveryAddressLine2:
            currentState.deliveryAddressLine2 || defaultAddress?.line2 || '',
          city: currentState.city || defaultAddress?.city || '',
          area: currentState.area || defaultAddress?.area || '',
          pincode: currentState.pincode || defaultAddress?.pincode || '',
          landmark: currentState.landmark || defaultAddress?.landmark || '',
        }))
      } catch {
        if (isMounted) {
          setSavedAddresses([])
        }
      }
    }

    void loadCustomerContext()

    return () => {
      isMounted = false
    }
  }, [user])

  function updateField<Key extends keyof CheckoutFormValues>(
    field: Key,
    value: CheckoutFormValues[Key],
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

    const nextErrors = validateCheckoutForm(formValues)
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || !shopId || !shopName) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await createOrder({
        shopId,
        shopName,
        addressId: formValues.addressId,
        customerName: formValues.customerName,
        customerPhone: formValues.customerPhone,
        customerEmail: formValues.customerEmail,
        deliveryAddressLine1: formValues.deliveryAddressLine1,
        deliveryAddressLine2: formValues.deliveryAddressLine2,
        city: formValues.city,
        area: formValues.area,
        pincode: formValues.pincode,
        landmark: formValues.landmark,
        notes: formValues.notes,
        paymentMethod: formValues.paymentMethod,
        items: items.map((item) => ({
          storeProductId: item.storeProductId,
          shopId: item.shopId,
          shopName: item.shopName,
          name: item.name,
          brand: item.brand,
          size: item.size,
          image: item.image,
          price: item.price,
          mrp: item.mrp,
          quantity: item.quantity,
        })),
      })

      if (user?.role !== 'CUSTOMER') {
        addGuestOrderId(response.item.id)
      }

      clearCart()
      navigate(`/order-success/${response.item.id}`, {
        state: {
          order: response.item,
        },
      })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setSubmitError(getApiErrorMessage(error, 'Unable to place order.'))
      } else {
        setSubmitError('Unable to place order.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasItems || !shopId || !shopName) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Checkout"
          title="Your cart is empty."
          description="Add products from a shop before moving into checkout."
        />

        <article className="rounded-[1.75rem] border border-white/80 bg-white/90 p-8 text-center shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
          <p className="text-sm leading-7 text-slate-600">
            There is nothing to place yet. Add a few items first and then come back here to finish your order.
          </p>
          <Link
            className="mt-6 inline-flex rounded-full bg-nearcart-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-nearcart-700"
            to="/cart"
          >
            Go to cart
          </Link>
        </article>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Checkout"
        title="Enter delivery details and place your order."
        description="Share your delivery details, review the cart total, and place your order when everything looks right."
      />

      {submitError ? (
        <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
          {submitError}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <form
          className="space-y-4 rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]"
          onSubmit={handleSubmit}
        >
          {user?.role === 'CUSTOMER' ? (
            <div className="rounded-[1.4rem] bg-nearcart-50/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    Signed in as {user.fullName}
                  </p>
                  <p className="text-sm text-slate-600">
                    Your checkout is linked to your NearCart customer account.
                  </p>
                </div>
                <Link
                  className="text-sm font-semibold text-nearcart-700"
                  to="/dashboard/customer/addresses"
                >
                  Manage saved addresses
                </Link>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {savedAddresses.length > 0 ? (
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Saved address
                </span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                  onChange={(event) => {
                    const selectedAddress = savedAddresses.find(
                      (address) => address.id === event.target.value,
                    )

                    updateField('addressId', event.target.value)

                    if (!selectedAddress) {
                      return
                    }

                    setFormValues((currentState) => ({
                      ...currentState,
                      addressId: selectedAddress.id,
                      customerName: currentState.customerName || selectedAddress.fullName,
                      customerPhone: currentState.customerPhone || selectedAddress.phone,
                      deliveryAddressLine1: selectedAddress.line1,
                      deliveryAddressLine2: selectedAddress.line2 || '',
                      city: selectedAddress.city,
                      area: selectedAddress.area || '',
                      pincode: selectedAddress.pincode,
                      landmark: selectedAddress.landmark || '',
                    }))
                  }}
                  value={formValues.addressId}
                >
                  <option value="">Choose a saved address</option>
                  {savedAddresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label} • {address.line1}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Full name
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                onChange={(event) =>
                  updateField('customerName', event.target.value)
                }
                value={formValues.customerName}
              />
              {fieldErrors.customerName ? (
                <span className="text-sm text-rose-600">
                  {fieldErrors.customerName}
                </span>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Phone</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                onChange={(event) =>
                  updateField('customerPhone', event.target.value)
                }
                value={formValues.customerPhone}
              />
              {fieldErrors.customerPhone ? (
                <span className="text-sm text-rose-600">
                  {fieldErrors.customerPhone}
                </span>
              ) : null}
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Email address
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                onChange={(event) =>
                  updateField('customerEmail', event.target.value)
                }
                value={formValues.customerEmail}
              />
              {fieldErrors.customerEmail ? (
                <span className="text-sm text-rose-600">
                  {fieldErrors.customerEmail}
                </span>
              ) : null}
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Address line 1
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                onChange={(event) =>
                  updateField('deliveryAddressLine1', event.target.value)
                }
                value={formValues.deliveryAddressLine1}
              />
              {fieldErrors.deliveryAddressLine1 ? (
                <span className="text-sm text-rose-600">
                  {fieldErrors.deliveryAddressLine1}
                </span>
              ) : null}
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Address line 2
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                onChange={(event) =>
                  updateField('deliveryAddressLine2', event.target.value)
                }
                value={formValues.deliveryAddressLine2}
              />
            </label>

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
              <span className="text-sm font-medium text-slate-700">
                Pincode
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                onChange={(event) => updateField('pincode', event.target.value)}
                value={formValues.pincode}
              />
              {fieldErrors.pincode ? (
                <span className="text-sm text-rose-600">
                  {fieldErrors.pincode}
                </span>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Landmark
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                onChange={(event) =>
                  updateField('landmark', event.target.value)
                }
                value={formValues.landmark}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Payment method
              </span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                onChange={(event) =>
                  updateField(
                    'paymentMethod',
                    event.target.value as CheckoutFormValues['paymentMethod'],
                  )
                }
                value={formValues.paymentMethod}
              >
                <option value="COD">Cash on delivery</option>
                <option value="PAY_ON_PICKUP">Pay on pickup</option>
              </select>
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Delivery notes
              </span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearcart-400"
                onChange={(event) => updateField('notes', event.target.value)}
                value={formValues.notes}
              />
            </label>
          </div>

          <button
            className="inline-flex w-full items-center justify-center rounded-full bg-nearcart-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-nearcart-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Placing order...' : 'Place order'}
          </button>
        </form>

        <aside className="space-y-4">
          <article className="rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
              Order summary
            </p>
            <h2 className="mt-3 font-display text-2xl text-ink-900">
              {shopName}
            </h2>
            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <div
                  key={item.storeProductId}
                  className="flex items-center justify-between gap-3 rounded-[1.35rem] bg-slate-50/80 px-4 py-3 text-sm text-slate-700"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">
                      {item.name}
                    </p>
                    <p className="text-slate-500">
                      {item.quantity} x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="font-semibold text-ink-900">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Total quantity</span>
                <span className="font-semibold text-ink-900">{cartCount}</span>
              </div>
              <div className="flex items-center justify-between text-base text-slate-700">
                <span>Subtotal</span>
                <span className="font-semibold text-nearcart-700">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  )
}
