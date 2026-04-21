import { useEffect, useState } from 'react'

import {
  getAdminShops,
  getInventoryOrganizations,
  updateShopStorefront,
} from '@/api/admin'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import type {
  AdminShopRow,
  InventoryOrganizationOption,
} from '@/types/admin'
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
  const [inventoryOrganizations, setInventoryOrganizations] = useState<
    InventoryOrganizationOption[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [savingShopId, setSavingShopId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadShops() {
      try {
        const [shopsResponse, inventoryResponse] = await Promise.all([
          getAdminShops(),
          getInventoryOrganizations(),
        ])

        if (!isMounted) {
          return
        }

        setShops(shopsResponse.items)
        setInventoryOrganizations(inventoryResponse.items)
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

  async function handleMappingSave(shop: AdminShopRow) {
    if (!shop.inventoryOrganizationId || !shop.inventoryBranchId) {
      setErrorMessage('Select both an inventory organization and branch before saving.')
      return
    }

    setSavingShopId(shop.id)
    setErrorMessage(null)

    try {
      const response = await updateShopStorefront(shop.id, {
        inventoryOrganizationId: shop.inventoryOrganizationId,
        inventoryBranchId: shop.inventoryBranchId,
        publicCatalogEnabled: shop.publicCatalogEnabled,
        logoImageUrl: shop.logoImageUrl || '',
      })

      setShops((currentShops) =>
        currentShops.map((currentShop) =>
          currentShop.id === shop.id
            ? {
                ...currentShop,
                ...response.item,
                inventoryMappingStatus:
                  response.item.inventoryOrganizationId &&
                  response.item.inventoryBranchId
                    ? 'MAPPED'
                    : 'UNMAPPED',
              }
            : currentShop,
        ),
      )
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, 'Unable to update shop storefront mapping.'),
      )
    } finally {
      setSavingShopId(null)
    }
  }

  if (isLoading) {
    return <LoadingScreen message="Loading platform shops..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Inspect all database-backed shops, connect them to the correct inventory organization and branch, and decide which approved shops can expose a public catalog."
        eyebrow="Admin shops"
        title="Platform shops"
      />

      <DashboardCard title="Shop registry">
        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-4">
          {shops.map((shop) => {
            const selectedOrganization = inventoryOrganizations.find(
              (organization) => organization.id === shop.inventoryOrganizationId,
            )
            const branches = selectedOrganization?.branches ?? []

            return (
              <article
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5"
                key={shop.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink-900">{shop.name}</p>
                    <p className="text-sm text-slate-500">
                      {shop.slug} • {[shop.area, shop.city].filter(Boolean).join(', ')}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Owner: {shop.owner.profile.businessName} ({shop.owner.user.email})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill
                      label={shop.approvalStatus}
                      tone={getApprovalTone(shop.approvalStatus)}
                    />
                    <StatusPill
                      label={shop.isActive ? 'Active' : 'Inactive'}
                      tone={shop.isActive ? 'success' : 'neutral'}
                    />
                    <StatusPill
                      label={shop.inventoryMappingStatus}
                      tone={shop.inventoryMappingStatus === 'MAPPED' ? 'success' : 'warning'}
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                  <select
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-nearcart-400"
                    onChange={(event) => {
                      const nextOrganization = inventoryOrganizations.find(
                        (organization) => organization.id === event.target.value,
                      )

                      setShops((currentShops) =>
                        currentShops.map((currentShop) =>
                          currentShop.id === shop.id
                            ? {
                                ...currentShop,
                                inventoryOrganizationId: event.target.value || null,
                                inventoryBranchId:
                                  nextOrganization?.branches[0]?.id ?? null,
                              }
                            : currentShop,
                        ),
                      )
                    }}
                    value={shop.inventoryOrganizationId ?? ''}
                  >
                    <option value="">Select inventory organization</option>
                    {inventoryOrganizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-nearcart-400"
                    onChange={(event) =>
                      setShops((currentShops) =>
                        currentShops.map((currentShop) =>
                          currentShop.id === shop.id
                            ? {
                                ...currentShop,
                                inventoryBranchId: event.target.value || null,
                              }
                            : currentShop,
                        ),
                      )
                    }
                    value={shop.inventoryBranchId ?? ''}
                  >
                    <option value="">Select inventory branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                        {branch.city ? ` • ${branch.city}` : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    className="inline-flex items-center justify-center rounded-full bg-nearcart-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-nearcart-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={savingShopId === shop.id}
                    onClick={() => handleMappingSave(shop)}
                    type="button"
                  >
                    {savingShopId === shop.id ? 'Saving...' : 'Save mapping'}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <label className="inline-flex items-center gap-2">
                    <input
                      checked={shop.publicCatalogEnabled}
                      onChange={(event) =>
                        setShops((currentShops) =>
                          currentShops.map((currentShop) =>
                            currentShop.id === shop.id
                              ? {
                                  ...currentShop,
                                  publicCatalogEnabled: event.target.checked,
                                }
                              : currentShop,
                          ),
                        )
                      }
                      type="checkbox"
                    />
                    Public catalog enabled
                  </label>
                  <span>
                    Current map: {shop.inventoryOrganizationId ?? 'No org'} /{' '}
                    {shop.inventoryBranchId ?? 'No branch'}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      </DashboardCard>
    </div>
  )
}
