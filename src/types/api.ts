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

export interface ShopPreview {
  id: string
  name: string
  category: string
  neighborhood: string
  etaMinutes: number
}

export interface StoreProduct {
  storeProductId: string
  name: string
  brand: string
  size: string
  image: string
  price: number
  mrp: number
  stockQty: number | null
  stockStatus: StockStatus
}

export interface ShopDetails extends ShopPreview {
  products: StoreProduct[]
}

export interface ShopListResponse {
  items: ShopPreview[]
  meta: ApiMeta & {
    source: string
    inventory: InventoryBridgeMeta
  }
}

export interface ShopDetailsResponse {
  item: ShopDetails
  meta: ApiMeta & {
    source: string
    inventory: InventoryBridgeMeta
  }
}
