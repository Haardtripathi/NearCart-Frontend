import { httpClient } from '@/api/http'
import type {
  AdminApprovalsResponse,
  AdminOrdersResponse,
  AdminShopsResponse,
  AdminUsersResponse,
  InventoryOrganizationsResponse,
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

export async function getAdminOrders() {
  const { data } = await httpClient.get<AdminOrdersResponse>('/admin/orders')

  return data
}
