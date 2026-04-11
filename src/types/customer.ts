import type { ApiMeta } from '@/types/api'
import type { AuthUser } from '@/types/auth'
import type { OrderPreview } from '@/types/order'

export interface Address {
  id: string
  userId: string
  label: string
  fullName: string
  phone: string
  line1: string
  line2: string | null
  city: string
  area: string | null
  pincode: string
  landmark: string | null
  latitude: number | null
  longitude: number | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface AddressFormValues {
  label: string
  fullName: string
  phone: string
  line1: string
  line2: string
  city: string
  area: string
  pincode: string
  landmark: string
  isDefault: boolean
}

export interface CustomerProfileRecord {
  id: string
  userId: string
  defaultAddressId: string | null
  createdAt: string
  updatedAt: string
  defaultAddress: Address | null
}

export interface CustomerProfileResponse {
  item: {
    user: AuthUser
    profile: CustomerProfileRecord
    stats: {
      addressCount: number
      orderCount: number
    }
  }
  meta: ApiMeta
}

export interface CustomerProfileUpdatePayload {
  fullName?: string
  phone?: string
}

export interface AddressResponse {
  item: Address
  meta: ApiMeta
}

export interface AddressListResponse {
  items: Address[]
  meta: ApiMeta & {
    total: number
  }
}

export interface CustomerOrdersResponse {
  items: OrderPreview[]
  meta: ApiMeta & {
    total: number
  }
}
