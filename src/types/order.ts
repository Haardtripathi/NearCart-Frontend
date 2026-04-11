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
  city: string
  area: string
  pincode: string
  landmark: string
  notes: string
  paymentMethod: PaymentMethod
}

export interface CreateOrderPayload extends CheckoutFormValues {
  shopId: string
  shopName: string
  items: Array<
    Pick<
      CartItem,
      | 'storeProductId'
      | 'shopId'
      | 'shopName'
      | 'name'
      | 'brand'
      | 'size'
      | 'image'
      | 'price'
      | 'mrp'
      | 'quantity'
    >
  >
}

export interface OrderItem {
  id: string
  orderId: string
  storeProductId: string
  name: string
  brand: string | null
  size: string | null
  image: string | null
  price: number
  mrp: number | null
  quantity: number
  lineTotal: number
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
  platformFee: number
  totalAmount: number
  placedAt: string
  acceptedAt: string | null
  deliveredAt: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
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
