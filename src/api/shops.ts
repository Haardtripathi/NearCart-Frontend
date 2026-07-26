import { httpClient } from '@/api/http'
import type {
  PublicCartValidationResponse,
  PublicCatalogProductResponse,
  PublicCatalogResponse,
  PublicShopListResponse,
  PublicShopResponse,
} from '@/types/api'

export interface ShopCatalogQuery {
  search?: string
  category?: string
  brand?: string
  inStockOnly?: boolean
  page?: number
  limit?: number
  sort?: 'featured' | 'name-asc' | 'price-asc' | 'price-desc' | 'newest'
  lang?: string
  lat?: number
  lng?: number
}

export interface ShopGeoQuery {
  lat?: number
  lng?: number
}

export async function getShops(query: ShopGeoQuery = {}) {
  const { data } = await httpClient.get<PublicShopListResponse>('/public/shops', {
    params: query,
  })

  return data
}

export async function getShopDetails(shopIdOrSlug: string, query: ShopGeoQuery = {}) {
  const { data } = await httpClient.get<PublicShopResponse>(
    `/public/shops/${shopIdOrSlug}`,
    {
      params: query,
    },
  )

  return data
}

export async function getShopCatalog(
  shopIdOrSlug: string,
  query: ShopCatalogQuery = {},
) {
  const { data } = await httpClient.get<PublicCatalogResponse>(
    `/public/shops/${shopIdOrSlug}/catalog`,
    {
      params: query,
    },
  )

  return data
}

export async function getShopCatalogProduct(
  shopIdOrSlug: string,
  productId: string,
  lang?: string,
) {
  const { data } = await httpClient.get<PublicCatalogProductResponse>(
    `/public/shops/${shopIdOrSlug}/catalog/${productId}`,
    {
      params: lang ? { lang } : undefined,
    },
  )

  return data
}

export async function validateCart(payload: {
  shopId: string
  items: Array<{
    productId: string
    variantId?: string | null
    quantity: number
    expectedPrice?: number
    expectedMrp?: number | null
  }>
  lang?: string
}) {
  const { data } = await httpClient.post<PublicCartValidationResponse>(
    '/public/cart/validate',
    payload,
  )

  return data
}
