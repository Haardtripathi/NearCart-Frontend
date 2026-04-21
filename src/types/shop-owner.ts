import type { ApiMeta } from '@/types/api'
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
