import { httpClient } from '@/api/http'
import type {
  CreateOrderPayload,
  OrderResponse,
} from '@/types/order'

export async function createOrder(payload: CreateOrderPayload) {
  const { data } = await httpClient.post<OrderResponse>('/orders', payload)

  return data
}

export async function getOrderById(orderId: string) {
  const { data } = await httpClient.get<OrderResponse>(`/orders/${orderId}`)

  return data
}

export async function cancelOrder(orderId: string) {
  const { data } = await httpClient.post<OrderResponse>(`/orders/${orderId}/cancel`)

  return data
}
