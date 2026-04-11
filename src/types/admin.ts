import type { ApiMeta } from '@/types/api'
import type { AuthUser } from '@/types/auth'
import type { OrderPreview } from '@/types/order'
import type { ManagedShop, ShopOwnerProfileRecord } from '@/types/shop-owner'

export interface AdminUserRow extends AuthUser {
  businessName: string | null
  shopOwnerApproved: boolean | null
  orderCount: number
  addressCount: number
}

export interface AdminUsersResponse {
  items: AdminUserRow[]
  meta: ApiMeta & {
    total: number
  }
}

export interface AdminApprovalItem {
  shop: ManagedShop
  owner: {
    user: AuthUser
    profile: ShopOwnerProfileRecord
  }
}

export interface AdminApprovalsResponse {
  items: AdminApprovalItem[]
  meta: ApiMeta & {
    total: number
  }
}

export interface AdminShopRow extends ManagedShop {
  owner: {
    user: AuthUser
    profile: ShopOwnerProfileRecord
  }
}

export interface AdminShopsResponse {
  items: AdminShopRow[]
  meta: ApiMeta & {
    total: number
    pendingCount: number
  }
}

export interface AdminOrderRow extends OrderPreview {
  customerEmail: string | null
  customerPhone: string
  deliveryFee: number
  platformFee: number
  subtotal: number
}

export interface AdminOrdersResponse {
  items: AdminOrderRow[]
  meta: ApiMeta & {
    total: number
  }
}
