import { httpClient } from '@/api/http'
import type {
  CreateOrderPayload,
  OrderListResponse,
  OrderResponse,
} from '@/types/order'

export async function createOrder(payload: CreateOrderPayload) {
  const { data } = await httpClient.post<OrderResponse>('/orders', payload)

  return data
}

export async function getOrders() {
  const { data } = await httpClient.get<OrderListResponse>('/orders')

  return data
}

export async function getOrderById(orderId: string) {
  const { data } = await httpClient.get<OrderResponse>(`/orders/${orderId}`)

  return data
}
