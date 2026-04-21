import type { StockStatus } from '@/types/api'

export interface CartItem {
  cartItemId: string
  productId: string
  variantId: string | null
  shopId: string
  shopName: string
  name: string
  description: string | null
  brand: string | null
  category: string | null
  unitLabel: string | null
  image: string | null
  price: number
  mrp: number | null
  stockQty: number
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
