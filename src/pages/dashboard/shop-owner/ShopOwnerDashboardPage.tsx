import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getShopOwnerProfile, getShopOwnerShops } from '@/api/shopOwner'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { StatCard } from '@/components/dashboard/StatCard'
import { getButtonClassName } from '@/components/shared/Button'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import type { ManagedShop, ShopOwnerProfileResponse } from '@/types/shop-owner'
import { getApiErrorMessage } from '@/utils/api'
import { getTodayStatusLabel, getTodayStatusTone } from '@/utils/shopAvailability'

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

export function ShopOwnerDashboardPage() {
  const [profile, setProfile] = useState<ShopOwnerProfileResponse['item'] | null>(
    null,
  )
  const [shops, setShops] = useState<ManagedShop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        const [profileResponse, shopsResponse] = await Promise.all([
          getShopOwnerProfile(),
          getShopOwnerShops(),
        ])

        if (!isMounted) {
          return
        }

        setProfile(profileResponse.item)
        setShops(shopsResponse.items)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          getApiErrorMessage(error, 'Unable to load your shop owner dashboard right now.'),
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return <LoadingScreen message="Loading your merchant dashboard..." />
  }

  if (!profile) {
    return (
      <DashboardCard title="Merchant dashboard unavailable">
        <p className="text-sm text-accent-700">
          {errorMessage || 'We could not load your shop owner dashboard.'}
        </p>
      </DashboardCard>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage your merchant identity, create shops, and keep a close eye on approval status as NearKart grows into a full operating platform."
        eyebrow="Shop owner dashboard"
        title={`Hello, ${profile.profile.businessName}`}
      />

      {errorMessage ? (
        <div className="rounded-[1.5rem] border border-accent-200 bg-accent-50 px-5 py-4 text-sm text-accent-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          description="Shops already registered under your merchant workspace."
          label="Total shops"
          value={profile.stats.shopCount}
        />
        <StatCard
          description="Shops approved and ready for future public rollout."
          label="Approved"
          value={profile.stats.approvedShopCount}
        />
        <StatCard
          description="Shops still waiting for platform review."
          label="Pending"
          value={profile.stats.pendingShopCount}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <DashboardCard
          actions={
            <Link
              className={getButtonClassName('primary', 'md')}
              to="/dashboard/shop-owner/shops/new"
            >
              + Create a shop
            </Link>
          }
          description="Your merchant profile powers future multi-shop operations, platform approvals, and the next inventory and order-management steps."
          title="Merchant summary"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-nearkart-50/70 px-4 py-4 ring-1 ring-nearkart-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-nearkart-700">Owner</p>
              <p className="mt-2 font-semibold text-ink-900">{profile.user.fullName}</p>
            </div>
            <div className="rounded-2xl bg-nearkart-50/70 px-4 py-4 ring-1 ring-nearkart-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-nearkart-700">Business</p>
              <p className="mt-2 font-semibold text-ink-900">
                {profile.profile.businessName}
              </p>
            </div>
            <div className="rounded-2xl bg-nearkart-50/70 px-4 py-4 ring-1 ring-nearkart-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-nearkart-700">GST number</p>
              <p className="mt-2 font-semibold text-ink-900">
                {profile.profile.gstNumber || 'Not provided yet'}
              </p>
            </div>
            <div className="rounded-2xl bg-nearkart-50/70 px-4 py-4 ring-1 ring-nearkart-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-nearkart-700">Merchant approval</p>
              <div className="mt-2">
                <StatusPill
                  label={profile.profile.isApproved ? 'Approved' : 'Pending'}
                  tone={profile.profile.isApproved ? 'success' : 'warning'}
                />
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          description="Your recently created shops and their platform review state."
          title="Latest shops"
        >
          {shops.length > 0 ? (
            <div className="space-y-3">
              {shops.slice(0, 5).map((shop) => (
                <Link
                  key={shop.id}
                  className="flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white/70 px-4 py-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-nearkart-200 hover:shadow-[var(--shadow-card-hover)]"
                  to={`/dashboard/shop-owner/shops/${shop.id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">{shop.name}</p>
                      <p className="text-sm text-ink-500">
                        {shop.category} • {shop.city}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill
                        label={shop.approvalStatus}
                        tone={getApprovalTone(shop.approvalStatus)}
                      />
                      <StatusPill
                        label={getTodayStatusLabel(shop.todayStatus)}
                        tone={getTodayStatusTone(shop.todayStatus)}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-ink-500">
                    {shop.isActive ? 'Active shop shell' : 'Inactive shop shell'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-ink-50 px-4 py-5 text-sm text-ink-500">
              No shops created yet. Create your first shop to start the merchant approval flow.
            </div>
          )}
        </DashboardCard>
      </section>

      <DashboardCard
        description="These are the next surfaces already prepared by this foundation, so your team can extend without a major rewrite later."
        title="What comes next"
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[
            'Inventory and stock modules can attach to each approved shop without replacing the auth layer.',
            'Order operations can plug into the same shop records and approval workflow.',
            'Public storefront exposure can later switch from mock-only shops to approved database-backed shops.',
          ].map((point, index) => (
            <div
              key={point}
              className="rounded-2xl bg-ink-50 px-4 py-4 text-sm leading-7 text-ink-600"
            >
              <span className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-nearkart-600 text-xs font-bold text-white">
                {index + 1}
              </span>
              <p>{point}</p>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  )
}
