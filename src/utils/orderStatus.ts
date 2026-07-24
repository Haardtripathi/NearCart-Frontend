import type { OrderStatus } from '@/types/order'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: 'Pending confirmation',
  ACCEPTED: 'Confirmed',
  REJECTED: 'Rejected',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for pickup',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export type OrderStatusTone = 'success' | 'neutral' | 'danger' | 'warning'

export const ORDER_STATUS_TONES: Record<OrderStatus, OrderStatusTone> = {
  PENDING_CONFIRMATION: 'warning',
  ACCEPTED: 'neutral',
  REJECTED: 'danger',
  PREPARING: 'neutral',
  READY_FOR_PICKUP: 'neutral',
  OUT_FOR_DELIVERY: 'neutral',
  DELIVERED: 'success',
  CANCELLED: 'danger',
}
