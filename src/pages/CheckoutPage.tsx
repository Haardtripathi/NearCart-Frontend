import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

import { getCustomerAddresses, getCustomerProfile } from '@/api/customer'
import { createOrder } from '@/api/orders'
import { validateCart } from '@/api/shops'
import { PageHeader } from '@/components/PageHeader'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import type { ValidatedCartItem } from '@/types/api'
import type { Address } from '@/types/customer'
import type { CheckoutFormValues } from '@/types/order'
import { getApiErrorMessage } from '@/utils/api'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatServiceAreaMessage, getServiceAreaErrorInfo } from '@/utils/serviceArea'

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

function buildCartItemFromValidatedItem(
  shopId: string,
  shopName: string,
  item: ValidatedCartItem & { quantity: number },
) {
  return {
    cartItemId: `${item.productId}:${item.variantId ?? 'default'}`,
    productId: item.productId,
    variantId: item.variantId,
    shopId,
    shopName,
    name: item.name ?? 'Unavailable item',
    description: item.description ?? null,
    brand: item.brand?.name ?? null,
    category: item.category?.name ?? null,
    unitLabel: item.unitLabel ?? null,
    image: item.image ?? null,
    price: item.price ?? 0,
    mrp: item.mrp ?? null,
    stockQty: item.availableQty,
    stockStatus: item.stockStatus,
    quantity: item.quantity,
  }
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const {
    shopId,
    shopName,
    items,
    getCartCount,
    getCartSubtotal,
    clearCart,
    replaceCart,
  } = useCartStore((state) => state)
  const [formValues, setFormValues] =
    useState<CheckoutFormValues>(initialFormValues)
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CheckoutFormValues, string>>
  >({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [serviceAreaMessage, setServiceAreaMessage] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [isValidatingCart, setIsValidatingCart] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasItems = items.length > 0
  const subtotal = getCartSubtotal()
  const cartCount = getCartCount()
  const cartValidationKey = useMemo(
    () =>
      items
        .map((item) =>
          [
            item.productId,
            item.variantId ?? 'default',
            item.quantity,
            item.price,
            item.mrp ?? '',
          ].join(':'),
        )
        .join('|'),
    [items],
  )
  const lastValidatedCartKeyRef = useRef<string | null>(null)

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

  useEffect(() => {
    let isMounted = true

    async function runInitialCartValidation() {
      if (!shopId || !shopName || items.length === 0) {
        lastValidatedCartKeyRef.current = null
        setIsValidatingCart(false)
        return
      }

      if (lastValidatedCartKeyRef.current === cartValidationKey) {
        return
      }

      lastValidatedCartKeyRef.current = cartValidationKey

      setIsValidatingCart(true)

      try {
        const response = await validateCart({
          shopId,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            expectedPrice: item.price,
            expectedMrp: item.mrp,
          })),
        })

        if (!isMounted) {
          return
        }

        replaceCart({
          shopId: response.item.shop.id,
          shopName: response.item.shop.name,
          items: response.item.appliedItems.map((item) =>
            buildCartItemFromValidatedItem(
              response.item.shop.id,
              response.item.shop.name,
              item,
            ),
          ),
        })

        if (
          response.item.invalidItems.length > 0 ||
          response.item.outOfStockItems.length > 0 ||
          response.item.changedPriceItems.length > 0
        ) {
          setValidationMessage(
            'Your cart was refreshed with live stock and pricing. Please review the updated quantities before placing the order.',
          )
        } else {
          setValidationMessage(null)
        }
      } catch (error) {
        lastValidatedCartKeyRef.current = null

        if (isMounted) {
          const serviceAreaInfo = getServiceAreaErrorInfo(error)

          if (serviceAreaInfo) {
            setServiceAreaMessage(formatServiceAreaMessage(serviceAreaInfo))
          } else {
            setSubmitError(
              getApiErrorMessage(error, 'Unable to validate the live cart right now.'),
            )
          }
        }
      } finally {
        if (isMounted) {
          setIsValidatingCart(false)
        }
      }
    }

    void runInitialCartValidation()

    return () => {
      isMounted = false
    }
  }, [cartValidationKey, items, replaceCart, shopId, shopName])

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

    if (Object.keys(nextErrors).length > 0 || !shopId || items.length === 0) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setServiceAreaMessage(null)

    try {
      const validationResponse = await validateCart({
        shopId,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          expectedPrice: item.price,
          expectedMrp: item.mrp,
        })),
      })

      replaceCart({
        shopId: validationResponse.item.shop.id,
        shopName: validationResponse.item.shop.name,
        items: validationResponse.item.appliedItems.map((item) =>
          buildCartItemFromValidatedItem(
            validationResponse.item.shop.id,
            validationResponse.item.shop.name,
            item,
          ),
        ),
      })

      if (validationResponse.item.appliedItems.length === 0) {
        setSubmitError('Your cart is empty after live validation. Please add items again.')
        return
      }

      const response = await createOrder({
        shopId: validationResponse.item.shop.id,
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
        items: validationResponse.item.appliedItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          shopId: validationResponse.item.shop.id,
          quantity: item.quantity,
        })),
      })

      clearCart()
      navigate(`/order-success/${response.item.id}`, {
        state: {
          order: response.item,
        },
      })
    } catch (error) {
      const serviceAreaInfo = getServiceAreaErrorInfo(error)

      if (serviceAreaInfo) {
        setServiceAreaMessage(formatServiceAreaMessage(serviceAreaInfo))
      } else if (axios.isAxiosError(error)) {
        setSubmitError(getApiErrorMessage(error, 'Unable to place order.'))
      } else {
        setSubmitError('Unable to place order.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user && !user.isVerified) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Checkout"
          title="Verify your email to continue."
          description="For order confirmations and delivery updates to reach you reliably, verify your email address before placing an order."
        />

        <article className="rounded-[1.75rem] border border-amber-200 bg-amber-50/90 p-8 text-center shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
          <p className="text-sm leading-7 text-amber-900">
            Your account isn&apos;t verified yet. It only takes a minute — we&apos;ll send a
            6-digit code to your email.
          </p>
          <Link
            className="mt-6 inline-flex rounded-full bg-amber-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
            to="/verify-email?redirect=/checkout"
          >
            Verify email now
          </Link>
        </article>
      </div>
    )
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
            className="mt-6 inline-flex rounded-full bg-nearkart-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-nearkart-700"
            to="/cart"
          >
            Go to cart
          </Link>
        </article>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Checkout"
        title="Finalize your order"
        description="Enter your delivery details and choose a payment method to complete your purchase."
      />

      {serviceAreaMessage ? (
        <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50/90 p-6 text-sm text-rose-800">
          <p className="font-semibold text-rose-900">This shop can&apos;t deliver here.</p>
          <p className="mt-1">{serviceAreaMessage}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              className="inline-flex rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              to="/dashboard/customer/addresses"
            >
              Update delivery address
            </Link>
            <Link
              className="inline-flex rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              to="/shops"
            >
              Browse other shops
            </Link>
          </div>
        </section>
      ) : null}

      {validationMessage ? (
        <section className="rounded-2xl border border-sun-100 bg-sun-50/50 p-4 text-sm text-sun-700">
          {validationMessage}
        </section>
      ) : null}

      {submitError ? (
        <section className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-600">
          {submitError}
        </section>
      ) : null}

      <div className="grid gap-12 lg:grid-cols-[1fr_350px]">
        <form
          className="space-y-8"
          id="checkout-form"
          onSubmit={handleSubmit}
        >
          {/* Section 1: Identity */}
          <div className="rounded-[2.5rem] border border-ink-100 bg-white p-8 sm:p-10 shadow-sm">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-sm font-bold text-white">1</div>
              <h3 className="font-display text-xl font-bold text-ink-900">Your Identity</h3>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Full Name</span>
                <input
                  className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
                  onChange={(event) => updateField('customerName', event.target.value)}
                  placeholder="John Doe"
                  value={formValues.customerName}
                />
                {fieldErrors.customerName && <p className="text-xs font-medium text-rose-500">{fieldErrors.customerName}</p>}
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Phone Number</span>
                <input
                  className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
                  onChange={(event) => updateField('customerPhone', event.target.value)}
                  placeholder="+91 00000 00000"
                  value={formValues.customerPhone}
                />
                {fieldErrors.customerPhone && <p className="text-xs font-medium text-rose-500">{fieldErrors.customerPhone}</p>}
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Email Address (Optional)</span>
                <input
                  className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
                  onChange={(event) => updateField('customerEmail', event.target.value)}
                  placeholder="john@example.com"
                  type="email"
                  value={formValues.customerEmail}
                />
              </label>
            </div>
          </div>

          {/* Section 2: Delivery */}
          <div className="rounded-[2.5rem] border border-ink-100 bg-white p-8 sm:p-10 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-sm font-bold text-white">2</div>
                <h3 className="font-display text-xl font-bold text-ink-900">Delivery Address</h3>
              </div>
              {savedAddresses.length > 0 && (
                <div className="hidden sm:block">
                  <select
                    className="rounded-xl border border-ink-100 bg-ink-50 px-4 py-2 text-xs font-bold text-ink-700 outline-none transition focus:border-nearkart-200"
                    onChange={(event) => {
                      const selectedAddress = savedAddresses.find(
                        (address) => address.id === event.target.value,
                      )
                      updateField('addressId', event.target.value)
                      if (selectedAddress) {
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
                      }
                    }}
                    value={formValues.addressId}
                  >
                    <option value="">Use a saved address</option>
                    {savedAddresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Address Line 1</span>
                <input
                  className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
                  onChange={(event) => updateField('deliveryAddressLine1', event.target.value)}
                  placeholder="Street name, house/flat number"
                  value={formValues.deliveryAddressLine1}
                />
                {fieldErrors.deliveryAddressLine1 && <p className="text-xs font-medium text-rose-500">{fieldErrors.deliveryAddressLine1}</p>}
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Address Line 2 (Optional)</span>
                <input
                  className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
                  onChange={(event) => updateField('deliveryAddressLine2', event.target.value)}
                  placeholder="Apartment, suite, unit, etc."
                  value={formValues.deliveryAddressLine2}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">City</span>
                <input
                  className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
                  onChange={(event) => updateField('city', event.target.value)}
                  value={formValues.city}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Pincode</span>
                <input
                  className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
                  onChange={(event) => updateField('pincode', event.target.value)}
                  value={formValues.pincode}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Landmark</span>
                <input
                  className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
                  onChange={(event) => updateField('landmark', event.target.value)}
                  placeholder="Near big hospital..."
                  value={formValues.landmark}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Notes for delivery</span>
                <input
                  className="w-full rounded-2xl border border-ink-100 bg-ink-50/30 px-5 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-nearkart-200 focus:bg-white focus:ring-4 focus:ring-nearkart-50"
                  onChange={(event) => updateField('notes', event.target.value)}
                  placeholder="Ring twice, etc."
                  value={formValues.notes}
                />
              </label>
            </div>
          </div>

          {/* Section 3: Payment */}
          <div className="rounded-[2.5rem] border border-ink-100 bg-white p-8 sm:p-10 shadow-sm">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-sm font-bold text-white">3</div>
              <h3 className="font-display text-xl font-bold text-ink-900">Payment Method</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {(['COD', 'ONLINE', 'PAY_ON_PICKUP'] as const).map((method) => (
                <button
                  key={method}
                  className={`flex flex-col items-center justify-center gap-3 rounded-3xl border-2 p-6 transition-all ${formValues.paymentMethod === method
                    ? 'border-nearkart-500 bg-nearkart-50 shadow-sm'
                    : 'border-ink-100 bg-white hover:border-ink-200 hover:bg-ink-50/50'
                    }`}
                  onClick={() => updateField('paymentMethod', method)}
                  type="button"
                >
                  <span className="text-2xl">
                    {method === 'COD' ? '💵' : method === 'ONLINE' ? '💳' : '🏪'}
                  </span>
                  <span className="text-xs font-bold text-ink-900">
                    {method === 'COD' ? 'Cash on Delivery' : method === 'ONLINE' ? 'Online' : 'Pay on Pickup'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>

        <aside className="relative">
          <div className="sticky top-28 space-y-6">
            <article className="overflow-hidden rounded-[2.5rem] border border-ink-100 bg-white shadow-glass">
              <div className="border-b border-ink-50 bg-ink-50/30 px-8 py-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-nearkart-600">
                  Order Summary
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-ink-900">
                  {cartCount} Items
                </h2>
              </div>

              <div className="space-y-6 p-8">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-400">Shop</span>
                    <span className="font-bold text-ink-900">{shopName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-400">Subtotal</span>
                    <span className="font-bold text-ink-900">{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-ink-900 p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Total Estimate</span>
                    <span className="text-xl font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <button
                  className="flex w-full h-14 items-center justify-center rounded-xl bg-nearkart-600 text-sm font-bold text-white shadow-md shadow-nearkart-600/20 transition hover:bg-nearkart-700 active:scale-95 disabled:grayscale disabled:opacity-50"
                  disabled={isSubmitting || isValidatingCart}
                  form="checkout-form"
                  type="submit"
                >
                  {isSubmitting ? 'Placing Order...' : isValidatingCart ? 'Validating...' : 'Place My Order'}
                </button>

                <Link
                  className="flex h-12 items-center justify-center rounded-xl border border-ink-100 bg-white text-sm font-bold text-ink-700 transition hover:bg-ink-50"
                  to="/cart"
                >
                  Edit Cart
                </Link>
              </div>
            </article>

            <div className="rounded-2xl border border-ink-100 bg-ink-50/50 p-4">
              <div className="flex gap-3">
                <span className="text-xl">🛡️</span>
                <p className="text-[10px] font-medium leading-relaxed text-ink-400">
                  Checkout is safe and secure. Your order is sent directly to the local shop owner for immediate fulfillment.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
