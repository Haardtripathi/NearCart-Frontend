import { httpClient } from '@/api/http'
import type {
  ShopListResponse,
  ShopOwnerProfileResponse,
  ShopOwnerProfileUpdatePayload,
  ShopPayload,
  ShopResponse,
} from '@/types/shop-owner'

export async function getShopOwnerProfile() {
  const { data } = await httpClient.get<ShopOwnerProfileResponse>(
    '/shop-owner/profile',
  )

  return data
}

export async function updateShopOwnerProfile(
  payload: ShopOwnerProfileUpdatePayload,
) {
  const { data } = await httpClient.patch<ShopOwnerProfileResponse>(
    '/shop-owner/profile',
    payload,
  )

  return data
}

export async function createShop(payload: ShopPayload) {
  const { data } = await httpClient.post<ShopResponse>('/shop-owner/shops', payload)

  return data
}

export async function getShopOwnerShops() {
  const { data } = await httpClient.get<ShopListResponse>('/shop-owner/shops')

  return data
}

export async function getShopOwnerShop(shopId: string) {
  const { data } = await httpClient.get<ShopResponse>(
    `/shop-owner/shops/${shopId}`,
  )

  return data
}

export async function updateShop(shopId: string, payload: ShopPayload) {
  const { data } = await httpClient.patch<ShopResponse>(
    `/shop-owner/shops/${shopId}`,
    payload,
  )

  return data
}
