import { useEffect, useState } from 'react'

import { getAdminShops } from '@/api/admin'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import type { AdminShopRow } from '@/types/admin'
import { getApiErrorMessage } from '@/utils/api'

function getApprovalTone(status: AdminShopRow['approvalStatus']) {
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

export function AdminShopsPage() {
  const [shops, setShops] = useState<AdminShopRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadShops() {
      try {
        const response = await getAdminShops()

        if (!isMounted) {
          return
        }

        setShops(response.items)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          getApiErrorMessage(error, 'Unable to load platform shops right now.'),
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
    return <LoadingScreen message="Loading platform shops..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Inspect all database-backed shops across the NearCart platform."
        eyebrow="Admin shops"
        title="Platform shops"
      />

      <DashboardCard title="Shop registry">
        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="pb-3 font-medium">Shop</th>
                <th className="pb-3 font-medium">Owner</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {shops.map((shop) => (
                <tr key={shop.id}>
                  <td className="py-4">
                    <p className="font-semibold text-ink-900">{shop.name}</p>
                    <p className="text-sm text-slate-500">{shop.slug}</p>
                  </td>
                  <td className="py-4">
                    <p className="font-medium text-ink-900">
                      {shop.owner.profile.businessName}
                    </p>
                    <p className="text-sm text-slate-500">{shop.owner.user.email}</p>
                  </td>
                  <td className="py-4">
                    {[shop.area, shop.city].filter(Boolean).join(', ') || shop.city}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  )
}
