import type { ApiMeta, ShopTodayStatus } from '@/types/api'
import type { AuthUser } from '@/types/auth'

export type ShopApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface ShopOwnerProfileRecord {
  id: string
  userId: string
  businessName: string
  gstNumber: string | null
  isApproved: boolean
  createdAt: string
  updatedAt: string
}

export interface ManagedShop {
  id: string
  ownerProfileId: string
  name: string
  slug: string
  description: string | null
  logoImageUrl: string | null
  category: string
  phone: string
  email: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  area: string | null
  pincode: string
  latitude: number | null
  longitude: number | null
  openingTime: string | null
  closingTime: string | null
  publicCatalogEnabled: boolean
  inventoryOrganizationId: string | null
  inventoryBranchId: string | null
  deliveryEnabled: boolean
  minimumOrderAmount: number
  deliveryFeeDefault: number
  estimatedDeliveryMinutes: number | null
  serviceRadiusKm: number | null
  lastCatalogSyncAt: string | null
  isActive: boolean
  approvalStatus: ShopApprovalStatus
  createdAt: string
  updatedAt: string
  /**
   * Daily open/closed state, set via `PATCH /shop-owner/shops/:id/today-status` — resets
   * every day, so this reflects only *today's* confirmation, not a permanent setting.
   * Assumed to be included on the same `ManagedShop` record returned by
   * `GET /shop-owner/shops` / `GET /shop-owner/shops/:id`, matching how `todayStatus` rides
   * along on the public shop responses (`PublicShopSummary`) — re-verify against the backend
   * once it lands, since the contract only spells out the PATCH response shape explicitly.
   */
  todayStatus: ShopTodayStatus
  todayStatusReason: string | null
  todayStatusUpdatedAt: string | null
}

export interface ShopOwnerProfileResponse {
  item: {
    user: AuthUser
    profile: ShopOwnerProfileRecord
    stats: {
      shopCount: number
      approvedShopCount: number
      pendingShopCount: number
    }
  }
  meta: ApiMeta
}

export interface ShopOwnerProfileUpdatePayload {
  fullName?: string
  phone?: string
  businessName?: string
  gstNumber?: string
}

export interface ShopFormValues {
  name: string
  description: string
  logoImageUrl: string
  category: string
  phone: string
  email: string
  addressLine1: string
  addressLine2: string
  city: string
  area: string
  pincode: string
  latitude: number | null
  longitude: number | null
  openingTime: string
  closingTime: string
  deliveryEnabled: boolean
  minimumOrderAmount: number
  deliveryFeeDefault: number
  estimatedDeliveryMinutes: number | null
  serviceRadiusKm: number | null
  isActive: boolean
}

export interface ShopPayload {
  name?: string
  description?: string
  logoImageUrl?: string
  category?: string
  phone?: string
  email?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  area?: string
  pincode?: string
  latitude?: number | null
  longitude?: number | null
  openingTime?: string
  closingTime?: string
  deliveryEnabled?: boolean
  minimumOrderAmount?: number
  deliveryFeeDefault?: number
  estimatedDeliveryMinutes?: number | null
  serviceRadiusKm?: number | null
  isActive?: boolean
}

export interface ShopResponse {
  item: ManagedShop
  meta: ApiMeta
}

export interface ShopListResponse {
  items: ManagedShop[]
  meta: ApiMeta & {
    total: number
  }
}

export interface ShopLogoUploadResponse {
  item: { url: string }
  meta: ApiMeta
}

export interface ShopTodayStatusPayload {
  isOpen: boolean
  reason?: string
}

/**
 * `PATCH /shop-owner/shops/:id/today-status` per the rain-fee/shop-availability contract responds
 * with these three fields directly (no `item`/`meta` envelope spelled out in the contract, unlike
 * every other endpoint in this file) — matched literally here rather than assumed-wrapped, since
 * the backend agent was briefed with the identical literal shape. Worth a quick integration check
 * once the backend lands, in case it actually does wrap this like everything else.
 */
export interface ShopTodayStatusResult {
  todayStatus: ShopTodayStatus
  todayStatusReason: string | null
  todayStatusUpdatedAt: string
}
