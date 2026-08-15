import type { CartItem } from '@/types/cart'
import type { ApiMeta } from '@/types/api'

export type PaymentMethod = 'COD' | 'ONLINE' | 'PAY_ON_PICKUP'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type OrderStatus =
  | 'PENDING_CONFIRMATION'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

export interface CheckoutFormValues {
  addressId: string
  customerName: string
  customerPhone: string
  customerEmail: string
  deliveryAddressLine1: string
  deliveryAddressLine2: string
  country: string
  state: string
  city: string
  area: string
  pincode: string
  landmark: string
  latitude: number | null
  longitude: number | null
  notes: string
  paymentMethod: PaymentMethod
  /** Optional promo code, resolved/re-validated authoritatively server-side inside
   *  `createOrder()` — never trust the client-previewed discount amount for the real charge. */
  couponCode: string
}

export interface CreateOrderPayload extends CheckoutFormValues {
  shopId: string
  items: Array<
    Pick<
      CartItem,
      | 'productId'
      | 'variantId'
      | 'shopId'
      | 'quantity'
    > & {
      // Mirrors `expectedPrice`/`expectedMrp` on `validateCart`'s item payload (see
      // `api/shops.ts`) — `POST /orders` (`orders.validation.ts`) now accepts these too and
      // rejects with 400 `CART_PRICE_CHANGED` if they've drifted since this value was captured.
      // Without sending them here, that server-side check was unreachable in practice: the
      // submit-time `validateCart` call in `CheckoutPage.tsx` catches a price change that
      // happened *before* it runs, but a price that changes in the gap between that call
      // returning and this `createOrder` call being sent had nothing to catch it — confirmed
      // live 2026-08-10, a price doubled in that window and the order was created at the new
      // price with a normal 201, no warning anywhere.
      expectedPrice?: number
      expectedMrp?: number | null
    }
  >
}

export interface OrderItem {
  id: string
  orderId: string
  storeProductId: string
  inventoryProductId: string | null
  inventoryVariantId: string | null
  name: string
  brand: string | null
  size: string | null
  unitLabel: string | null
  image: string | null
  price: number
  mrp: number | null
  quantity: number
  lineTotal: number
}

export interface OrderReviewSummary {
  id: string
  rating: number
  comment: string | null
  createdAt: string
}

export interface Order {
  id: string
  orderNumber: string
  customerUserId: string | null
  shopId: string
  shopRecordId: string | null
  shopName: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  customerName: string
  customerPhone: string
  customerEmail: string | null
  deliveryAddressId: string | null
  deliveryAddressLabel: string | null
  deliveryAddressLine1: string
  deliveryAddressLine2: string | null
  city: string
  area: string | null
  pincode: string
  landmark: string | null
  latitude: number | null
  longitude: number | null
  notes: string | null
  subtotal: number
  deliveryFee: number
  /** 0 / 20 / 40 (rupees), snapshotted at order-placement time. */
  weatherSurchargeFee: number
  /** e.g. "Clear" / "Rain" / "Thunderstorm" / "unknown", snapshotted at order-placement time. */
  weatherCondition: string
  platformFee: number
  totalAmount: number
  placedAt: string
  acceptedAt: string | null
  deliveredAt: string | null
  /** Delivery-proof photo URL (Cloudinary), relayed from NearCart-Inventory's driver app on a
   *  DELIVERED event/poll. Null for orders delivered before this field existed, or when the
   *  driver didn't capture a photo. */
  deliveryProofPhotoUrl: string | null
  /** Coupon applied at checkout, if any — backend already resolves/validates this at order-creation time. */
  couponCode: string | null
  discountAmount: number
  /** Set once the order reaches DELIVERED and loyalty points are credited; null until then. */
  loyaltyPointsEarned: number | null
  /** Populated once a driver is assigned (typically at/after READY_FOR_PICKUP) — mirrors
   *  `mapOrder()` in the backend's `utils/serializers.ts`. All null together until assignment. */
  driverName: string | null
  driverPhone: string | null
  driverVehicleType: string | null
  driverAssignedAt: string | null
  createdAt: string
  updatedAt: string
  /** True only while `status === 'PENDING_CONFIRMATION'` — drives whether a cancel button shows. */
  isCancellable: boolean
  items: OrderItem[]
  /** Null until the customer has rated this (necessarily `DELIVERED`) order. */
  review: OrderReviewSummary | null
}

export interface OrderPreview {
  id: string
  orderNumber: string
  customerUserId: string | null
  shopId: string
  shopName: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  totalAmount: number
  customerName: string
  placedAt: string
  deliveredAt: string | null
}

export interface OrderResponse {
  item: Order
  meta: ApiMeta & {
    source: string
  }
}

export interface OrderListResponse {
  items: OrderPreview[]
  meta: ApiMeta & {
    source: string
  }
}

export interface CouponPreview {
  valid: boolean
  discountAmount: number
  reason: string | null
  description: string | null
}

export interface CouponPreviewResponse {
  item: CouponPreview
}

export interface CreateOrderReviewPayload {
  rating: number
  comment?: string
}

export interface OrderReviewResponse {
  item: OrderReviewSummary
  meta: ApiMeta & {
    source: string
  }
}
