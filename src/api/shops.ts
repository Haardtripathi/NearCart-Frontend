import { httpClient } from '@/api/http'
import type {
  PublicCartValidationResponse,
  PublicCatalogProductResponse,
  PublicCatalogResponse,
  PublicSearchResponse,
  PublicShopCategoriesResponse,
  PublicShopListResponse,
  PublicShopResponse,
  PublicShopReviewsResponse,
  PublicTrendingResponse,
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
  search?: string
  category?: string
  city?: string
}

export interface CrossShopQuery {
  category?: string
  city?: string
  limit?: number
  lang?: string
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

export async function getShopReviews(
  shopIdOrSlug: string,
  query: { page?: number; limit?: number } = {},
) {
  const { data } = await httpClient.get<PublicShopReviewsResponse>(
    `/public/shops/${shopIdOrSlug}/reviews`,
    { params: query },
  )

  return data
}

export async function getShopCategories() {
  const { data } = await httpClient.get<PublicShopCategoriesResponse>(
    '/public/categories',
  )

  return data
}

export async function searchCatalog(q: string, query: CrossShopQuery = {}) {
  const { data } = await httpClient.get<PublicSearchResponse>('/public/search', {
    params: { q, ...query },
  })

  return data
}

export async function getTrendingProducts(query: CrossShopQuery = {}) {
  const { data } = await httpClient.get<PublicTrendingResponse>('/public/trending', {
    params: query,
  })

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
