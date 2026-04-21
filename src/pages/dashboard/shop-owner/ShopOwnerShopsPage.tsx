import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getShopOwnerShops } from '@/api/shopOwner'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import type { ManagedShop } from '@/types/shop-owner'
import { getApiErrorMessage } from '@/utils/api'

function getApprovalTone(status: ManagedShop['approvalStatus']) {
  switch (status) {
    case 'APPROVED':
      return 'success' as const
    case 'REJECTED':
      return 'danger' as const
    case 'PENDING':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

export function ShopOwnerShopsPage() {
  const [shops, setShops] = useState<ManagedShop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadShops() {
      try {
        const response = await getShopOwnerShops()

        if (!isMounted) {
          return
        }

        setShops(response.items)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          getApiErrorMessage(error, 'Unable to load your shops right now.'),
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadShops()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return <LoadingScreen message="Loading your shops..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Review every shop under your NearKart merchant account, edit details, and monitor approval state."
        eyebrow="Shop owner shops"
        title="Your shops"
      />

      <DashboardCard
        actions={
          <Link
            className="inline-flex items-center justify-center rounded-full bg-nearkart-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-nearkart-700"
            to="/dashboard/shop-owner/shops/new"
          >
            New shop
          </Link>
        }
        title="Shop list"
      >
        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {shops.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-3 font-medium">Shop</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Inventory</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {shops.map((shop) => (
                  <tr key={shop.id}>
                    <td className="py-4">
                      <p className="font-semibold text-ink-900">{shop.name}</p>
                      <p className="text-sm text-slate-500">{shop.slug}</p>
                    </td>
                    <td className="py-4">{shop.category}</td>
                    <td className="py-4">
                      {[shop.area, shop.city].filter(Boolean).join(', ') || shop.city}
                    </td>
                    <td className="py-4">
                      <StatusPill
                        label={
                          shop.inventoryOrganizationId && shop.inventoryBranchId
                            ? 'Mapped'
                            : 'Awaiting admin map'
                        }
                        tone={
                          shop.inventoryOrganizationId && shop.inventoryBranchId
                            ? 'success'
                            : 'warning'
                        }
                      />
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill
                          label={shop.approvalStatus}
                          tone={getApprovalTone(shop.approvalStatus)}
                        />
                        <StatusPill
                          label={shop.isActive ? 'Active' : 'Inactive'}
                          tone={shop.isActive ? 'success' : 'neutral'}
                        />
                      </div>
                    </td>
                    <td className="py-4">
                      <Link
                        className="font-semibold text-nearkart-700"
                        to={`/dashboard/shop-owner/shops/${shop.id}`}
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-[1.35rem] bg-slate-50 px-4 py-5 text-sm text-slate-600">
            No shops yet. Create your first shop to enter the approval queue.
          </div>
        )}
      </DashboardCard>
    </div>
  )
}
