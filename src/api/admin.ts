import { httpClient } from '@/api/http'
import type {
  AdminApprovalsResponse,
  AdminOrdersResponse,
  AdminShopsResponse,
  AdminUsersResponse,
} from '@/types/admin'
import type { ShopResponse, ShopApprovalStatus } from '@/types/shop-owner'

export async function getAdminUsers() {
  const { data } = await httpClient.get<AdminUsersResponse>('/admin/users')

  return data
}

export async function getPendingApprovals() {
  const { data } = await httpClient.get<AdminApprovalsResponse>(
    '/admin/shop-owners/pending',
  )

  return data
}

export async function updateShopApproval(
  shopId: string,
  approvalStatus: Exclude<ShopApprovalStatus, 'PENDING'>,
) {
  const { data } = await httpClient.patch<ShopResponse>(
    `/admin/shops/${shopId}/approval`,
    { approvalStatus },
  )

  return data
}

export async function getAdminShops() {
  const { data } = await httpClient.get<AdminShopsResponse>('/admin/shops')

  return data
}

export async function getAdminOrders() {
  const { data } = await httpClient.get<AdminOrdersResponse>('/admin/orders')

  return data
}
