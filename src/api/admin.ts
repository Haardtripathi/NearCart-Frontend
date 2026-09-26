import { httpClient } from '@/api/http'
import type {
  AdminApprovalsResponse,
  AdminOrdersResponse,
  AdminShopsResponse,
  AdminUsersResponse,
  InventoryOrganizationsResponse,
} from '@/types/admin'
import type { ShopResponse, ShopApprovalStatus } from '@/types/shop-owner'

// Every admin list is paged server-side (50 per page by default, 200 max) — follow
// `meta.hasMore` to reach the rest.
export interface AdminListQuery {
  page?: number
  limit?: number
}

export async function getAdminUsers(query: AdminListQuery = {}) {
  const { data } = await httpClient.get<AdminUsersResponse>('/admin/users', { params: query })

  return data
}

export async function getPendingApprovals(query: AdminListQuery = {}) {
  const { data } = await httpClient.get<AdminApprovalsResponse>(
    '/admin/shop-owners/pending',
    { params: query },
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

export async function getAdminShops(query: AdminListQuery = {}) {
  const { data } = await httpClient.get<AdminShopsResponse>('/admin/shops', { params: query })

  return data
}

export async function getInventoryOrganizations(search?: string) {
  const { data } = await httpClient.get<InventoryOrganizationsResponse>(
    '/admin/inventory/organizations',
    {
      params: search ? { search } : undefined,
    },
  )

  return data
}

export async function updateShopStorefront(
  shopId: string,
  payload: {
    inventoryOrganizationId: string
    inventoryBranchId: string
    publicCatalogEnabled: boolean
    logoImageUrl?: string
  },
) {
  const { data } = await httpClient.patch<ShopResponse>(
    `/admin/shops/${shopId}/storefront`,
    payload,
  )

  return data
}

export async function getAdminOrders(query: AdminListQuery = {}) {
  const { data } = await httpClient.get<AdminOrdersResponse>('/admin/orders', { params: query })

  return data
}
