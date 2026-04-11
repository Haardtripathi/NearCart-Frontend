import type { StockStatus } from '@/types/api'

export interface CartItem {
  storeProductId: string
  shopId: string
  shopName: string
  name: string
  brand: string
  size: string
  image: string
  price: number
  mrp: number
  stockQty: number | null
  stockStatus: StockStatus
  quantity: number
}

export interface CartSnapshot {
  shopId: string | null
  shopName: string | null
  items: CartItem[]
}

export interface CartAddResult {
  added: boolean
  replaced: boolean
  requiresConfirmation: boolean
  conflictShopName: string | null
}
