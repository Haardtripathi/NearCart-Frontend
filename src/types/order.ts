import type { CartItem } from '@/types/cart'

export type PaymentMethod = 'COD' | 'PAY_ON_PICKUP'
export type OrderStatus = 'PENDING'

export interface CheckoutFormValues {
  customerName: string
  customerPhone: string
  customerEmail: string
  deliveryAddressLine1: string
  deliveryAddressLine2: string
  city: string
  area: string
  pincode: string
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
  shopId: string
  shopName: string
  status: OrderStatus
  customerName: string
  customerPhone: string
  customerEmail: string | null
  deliveryAddressLine1: string
  deliveryAddressLine2: string | null
  city: string
  area: string | null
  pincode: string
  notes: string | null
  paymentMethod: PaymentMethod
  subtotal: number
  totalAmount: number
  createdAt: string
  placedAt: string
  items: OrderItem[]
}

export interface OrderPreview {
  id: string
  orderNumber: string
  status: OrderStatus
  totalAmount: number
  shopName: string
  customerName: string
  placedAt: string
}

export interface OrderResponse {
  item: Order
  meta: {
    source: string
    timestamp: string
  }
}

export interface OrderListResponse {
  items: OrderPreview[]
  meta: {
    source: string
    timestamp: string
  }
}
