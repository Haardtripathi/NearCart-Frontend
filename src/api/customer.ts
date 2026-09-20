import { httpClient } from '@/api/http'
import type {
  AddressFormValues,
  AddressListResponse,
  AddressResponse,
  CustomerOrdersResponse,
  CustomerProfileResponse,
  CustomerProfileUpdatePayload,
  LoyaltySummaryResponse,
} from '@/types/customer'
import type { CouponPreviewResponse } from '@/types/order'

export async function getCustomerProfile() {
  const { data } = await httpClient.get<CustomerProfileResponse>('/customer/profile')

  return data
}

export async function updateCustomerProfile(payload: CustomerProfileUpdatePayload) {
  const { data } = await httpClient.patch<CustomerProfileResponse>(
    '/customer/profile',
    payload,
  )

  return data
}

export async function getCustomerAddresses() {
  const { data } = await httpClient.get<AddressListResponse>('/customer/addresses')

  return data
}

export async function createCustomerAddress(payload: AddressFormValues) {
  const { data } = await httpClient.post<AddressResponse>(
    '/customer/addresses',
    payload,
  )

  return data
}

export async function updateCustomerAddress(
  addressId: string,
  payload: Partial<AddressFormValues>,
) {
  const { data } = await httpClient.patch<AddressResponse>(
    `/customer/addresses/${addressId}`,
    payload,
  )

  return data
}

export async function deleteCustomerAddress(addressId: string) {
  const { data } = await httpClient.delete<{ success: boolean }>(
    `/customer/addresses/${addressId}`,
  )

  return data
}

export async function getCustomerOrders() {
  const { data } = await httpClient.get<CustomerOrdersResponse>('/customer/orders')

  return data
}

/**
 * Advisory-only coupon preview for the checkout screen's "Apply" button (see
 * `coupon.service.ts`'s `previewCoupon` doc comment on the backend) — the real, trusted discount
 * is always recomputed server-side inside `createOrder()` against the authoritative subtotal, so
 * this is purely to show "You saved ₹X" (or why a code didn't apply) before submitting.
 */
export async function validateCoupon(code: string, subtotal: number) {
  const { data } = await httpClient.post<CouponPreviewResponse>('/customer/coupons/validate', {
    code,
    subtotal,
  })

  return data
}

/** New feature: loyalty-points redemption at checkout — the customer's running points balance,
 *  used to drive the checkout screen's "Redeem N points for ₹N off" control. The real discount
 *  is always recomputed server-side inside `createOrder()` (see backend's
 *  `resolveLoyaltyRedemptionForCheckout`), same "never trust a client-supplied money figure"
 *  posture as `validateCoupon` above — this is purely for showing a live, accurate preview. */
export async function getCustomerLoyalty() {
  const { data } = await httpClient.get<LoyaltySummaryResponse>('/customer/loyalty')

  return data
}
