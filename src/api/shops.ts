import { httpClient } from '@/api/http'
import type { ShopDetailsResponse, ShopListResponse } from '@/types/api'

export async function getShops() {
  const { data } = await httpClient.get<ShopListResponse>('/shops')

  return data
}

export async function getShopDetails(shopId: string) {
  const { data } = await httpClient.get<ShopDetailsResponse>(`/shops/${shopId}`)

  return data
}
