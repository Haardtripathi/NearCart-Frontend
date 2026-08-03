export interface ApiMeta {
  timestamp: string
}

export interface HealthResponse {
  status: string
  appName: string
  timestamp: string
}

export interface InventoryBridgeMeta {
  ready: boolean
  strategy: string
  baseUrl: string | null
  lastSync: string | null
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

/**
 * Daily open/closed state a shop owner sets via `PATCH
 * /shop-owner/shops/:id/today-status` — resets every day, distinct from the
 * shop's static `openingTime`/`closingTime` config. `PENDING_CONFIRMATION`
 * means the owner hasn't confirmed today's hours yet (treated the same as
 * "can't order right now" on the customer side, just with softer copy).
 */
export type ShopTodayStatus = 'OPEN' | 'CLOSED' | 'PENDING_CONFIRMATION'

export interface CatalogNamedValue {
  id: string
  slug: string
  name: string
}

export interface ProductTranslationMap {
  [languageCode: string]: {
    name: string | null
    description: string | null
  }
}

export interface PublicShopSummary {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  city: string
  area: string | null
  logoImageUrl: string | null
  estimatedDeliveryMinutes: number | null
  minimumOrderAmount: number
  deliveryFee: number
  deliveryEnabled: boolean
  isOpenNow: boolean | null
  /**
   * Live, computed ETA in minutes (queue + weather, plus distance when the
   * caller passed `lat`/`lng`). List responses (`GET /public/shops`) use a
   * cheaper "fast" estimate; detail/catalog responses use a fuller "full"
   * one. Always present (not optional) — the backend always attaches it.
   */
  liveEstimatedDeliveryMinutes: number
  /** Today's confirmed open/closed state — see `ShopTodayStatus`. */
  todayStatus: ShopTodayStatus
  /** Only meaningful when `todayStatus === 'CLOSED'`, e.g. "Holiday". */
  todayStatusReason: string | null
  /**
   * Straight-line distance from the caller's `lat`/`lng` query params to this shop, in km
   * (1 decimal place). Only present when the request included `lat`/`lng` — omitted entirely
   * on an anonymous/no-location request rather than `null`, since there's nothing to compute.
   */
  distanceKm?: number
}

export interface PublicShopDetail extends PublicShopSummary {
  phone: string
  email: string | null
  addressLine1: string
  addressLine2: string | null
  pincode: string
  openingTime: string | null
  closingTime: string | null
  serviceRadiusKm: number | null
  /** `null` until the shop has at least one review. */
  averageRating: number | null
  reviewCount: number
}

export interface PublicShopReview {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  reviewerName: string
}

export interface PublicShopReviewsResponse {
  items: PublicShopReview[]
  meta: ApiMeta & {
    source: string
    page: number
    limit: number
    totalItems: number
    totalPages: number
    averageRating: number | null
    reviewCount: number
  }
}

export interface PublicCatalogVariant {
  id: string
  sku: string
  barcode: string | null
  name: string
  imageUrl: string | null
  price: number
  mrp: number | null
  unitLabel: string | null
  isDefault: boolean
  stock: {
    availableQty: number
    stockStatus: StockStatus
    isAvailable: boolean
  }
}

export interface PublicCatalogProduct {
  id: string
  variantId: string
  slug: string
  name: string
  description: string | null
  image: string | null
  category: CatalogNamedValue | null
  brand: CatalogNamedValue | null
  price: number
  mrp: number | null
  stockStatus: StockStatus
  availableQty: number
  isAvailable: boolean
  unitLabel: string | null
  hasVariants: boolean
  variantCount: number
  translations: ProductTranslationMap
  variants: PublicCatalogVariant[]
}

export interface PublicCatalogFilters {
  categories: Array<{
    id: string
    slug: string
    name: string
  }>
  brands: Array<{
    id: string
    slug: string
    name: string
  }>
}

export interface PublicShopListResponse {
  items: PublicShopSummary[]
  meta: ApiMeta & {
    source: string
    total: number
  }
}

export interface PublicShopResponse {
  item: PublicShopDetail
  meta: ApiMeta & {
    source: string
  }
}

export interface PublicCatalogResponse {
  item: PublicShopDetail
  items: PublicCatalogProduct[]
  filters: PublicCatalogFilters
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
  inventory: {
    organization: {
      id: string
      name: string
      slug: string
      currencyCode: string
    }
    branch: {
      id: string
      name: string
      code: string | null
      city?: string | null
      type?: string
    }
  }
  meta: ApiMeta & {
    source: string
  }
}

export interface PublicCatalogProductResponse {
  shop: PublicShopDetail
  item: PublicCatalogProduct
  inventory: PublicCatalogResponse['inventory']
  meta: ApiMeta & {
    source: string
  }
}

export interface ValidatedCartItem {
  productId: string
  variantId: string | null
  shopId?: string
  shopName?: string
  name?: string
  description?: string | null
  image?: string | null
  category?: CatalogNamedValue | null
  brand?: CatalogNamedValue | null
  unitLabel?: string | null
  requestedQuantity: number
  quantityAccepted: number
  quantity?: number
  availableQty: number
  status: 'VALID' | 'NOT_FOUND' | 'OUT_OF_STOCK' | 'INSUFFICIENT_STOCK'
  stockStatus: StockStatus
  reason: string | null
  price: number | null
  mrp: number | null
  translations?: ProductTranslationMap
  expectedPrice?: number
  expectedMrp?: number | null
}

export interface PublicCartValidationResponse {
  item: {
    shop: PublicShopDetail
    validItems: ValidatedCartItem[]
    invalidItems: ValidatedCartItem[]
    outOfStockItems: ValidatedCartItem[]
    changedPriceItems: ValidatedCartItem[]
    appliedItems: Array<ValidatedCartItem & { quantity: number }>
    summary: {
      currencyCode: string
      subtotal: number
      deliveryFee: number
      /** 0 / 20 / 40 (rupees) — rain/weather-driven delivery surcharge. */
      weatherSurchargeFee: number
      /** e.g. "Clear" / "Rain" / "Thunderstorm" / "unknown". */
      weatherCondition: string
      /** Now = subtotal + deliveryFee + weatherSurchargeFee. */
      totalAmount: number
      itemCount: number
      validCount: number
      invalidCount: number
      outOfStockCount: number
      changedPriceCount: number
    }
    inventory: PublicCatalogResponse['inventory']
  }
  meta: ApiMeta & {
    source: string
  }
}
export interface PublicShopCategorySummary {
  category: string
  shopCount: number
}

export interface PublicShopCategoriesResponse {
  items: PublicShopCategorySummary[]
  meta: ApiMeta & {
    source: string
  }
}

export type PublicSearchResultItem = PublicCatalogProduct & {
  shop: PublicShopSummary
}

export interface PublicSearchResponse {
  items: PublicSearchResultItem[]
  meta: ApiMeta & {
    query: string
    shopsSearched: number
    shopsSucceeded: number
    shopsFailed: number
    strategy: string
    source: string
  }
}

export interface PublicTrendingResponse {
  items: PublicSearchResultItem[]
  meta: ApiMeta & {
    shopsQueried: number
    shopsSucceeded: number
    shopsFailed: number
    strategy: string
    source: string
  }
}
