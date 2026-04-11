import type { ApiMeta } from '@/types/api'

export type UserRole = 'CUSTOMER' | 'SHOP_OWNER' | 'ADMIN' | 'RIDER'

export interface AuthUser {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: UserRole
  isActive: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
  customerProfileId: string | null
  defaultAddressId: string | null
  shopOwnerProfileId: string | null
  shopOwnerApproved: boolean | null
  dashboardPath: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterCustomerPayload {
  fullName: string
  email: string
  phone: string
  password: string
}

export interface RegisterShopOwnerPayload extends RegisterCustomerPayload {
  businessName: string
  gstNumber: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
  meta: ApiMeta & {
    role: UserRole
    dashboardPath: string
    refreshExpiresAt: string
  }
}

export interface AuthMeResponse {
  user: AuthUser
  meta: ApiMeta & {
    role: UserRole
    dashboardPath: string
  }
}

export interface LogoutResponse {
  success: boolean
  meta: ApiMeta
}
