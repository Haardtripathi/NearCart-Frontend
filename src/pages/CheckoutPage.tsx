import { useEffect, useState } from 'react'
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
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [isValidatingCart, setIsValidatingCart] = useState(false)
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

  useEffect(() => {
    let isMounted = true

    async function runInitialCartValidation() {
      if (!shopId || !shopName || items.length === 0) {
        return
      }

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
        if (isMounted) {
          setSubmitError(
            getApiErrorMessage(error, 'Unable to validate the live cart right now.'),
          )
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
  }, [items.length, replaceCart, shopId, shopName])

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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Checkout"
        title="Enter delivery details and place your order."
        description="Checkout now validates against the live inventory bridge before an order is created."
      />

      {validationMessage ? (
        <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50/90 p-6 text-sm text-amber-900">
          {validationMessage}
        </section>
      ) : null}

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
            <div className="rounded-[1.4rem] bg-nearkart-50/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    Signed in as {user.fullName}
                  </p>
                  <p className="text-sm text-slate-600">
                    Your checkout is linked to your NearKart customer account.
                  </p>
                </div>
                <Link
                  className="text-sm font-semibold text-nearkart-700"
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
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

            {(
              [
                ['customerName', 'Full name'],
                ['customerPhone', 'Phone number'],
                ['customerEmail', 'Email address'],
                ['deliveryAddressLine1', 'Address line 1'],
                ['deliveryAddressLine2', 'Address line 2'],
                ['city', 'City'],
                ['area', 'Area'],
                ['pincode', 'Pincode'],
                ['landmark', 'Landmark'],
              ] as Array<[keyof CheckoutFormValues, string]>
            ).map(([field, label]) => (
              <label
                className={field === 'deliveryAddressLine1' ? 'space-y-2 sm:col-span-2' : 'space-y-2'}
                key={field}
              >
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                  onChange={(event) => updateField(field, event.target.value)}
                  type={field === 'customerEmail' ? 'email' : 'text'}
                  value={formValues[field]}
                />
                {fieldErrors[field] ? (
                  <span className="text-sm text-rose-600">{fieldErrors[field]}</span>
                ) : null}
              </label>
            ))}

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Notes</span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                onChange={(event) => updateField('notes', event.target.value)}
                value={formValues.notes}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Payment method</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-nearkart-400"
                onChange={(event) =>
                  updateField('paymentMethod', event.target.value as CheckoutFormValues['paymentMethod'])
                }
                value={formValues.paymentMethod}
              >
                <option value="COD">Cash on delivery</option>
                <option value="PAY_ON_PICKUP">Pay on pickup</option>
                <option value="ONLINE">Online payment</option>
              </select>
            </label>
          </div>

          <button
            className="inline-flex w-full items-center justify-center rounded-full bg-nearkart-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-nearkart-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            disabled={isSubmitting || isValidatingCart}
            type="submit"
          >
            {isSubmitting
              ? 'Placing order...'
              : isValidatingCart
                ? 'Validating cart...'
                : 'Place order'}
          </button>
        </form>

        <aside className="space-y-4">
          <article className="rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearkart-600">
              Order summary
            </p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Total quantity</span>
                <span className="font-semibold text-slate-800">{cartCount}</span>
              </div>
              <div className="flex items-center justify-between text-base text-slate-700">
                <span>Subtotal</span>
                <span className="font-semibold text-nearkart-700">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-nearkart-200 hover:text-nearkart-700"
                to="/cart"
              >
                Back to cart
              </Link>
            </div>
          </article>
        </aside>
      </section>
    </div>
  )
}
