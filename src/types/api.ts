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
