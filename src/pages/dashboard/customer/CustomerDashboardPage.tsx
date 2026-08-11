import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getCustomerOrders, getCustomerProfile } from '@/api/customer'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { StatCard } from '@/components/dashboard/StatCard'
import { getButtonClassName } from '@/components/shared/Button'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import type { CustomerProfileResponse } from '@/types/customer'
import type { OrderPreview } from '@/types/order'
import { getApiErrorMessage } from '@/utils/api'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime } from '@/utils/formatDateTime'

export function CustomerDashboardPage() {
  const [profile, setProfile] = useState<CustomerProfileResponse['item'] | null>(null)
  const [orders, setOrders] = useState<OrderPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        const [profileResponse, ordersResponse] = await Promise.all([
          getCustomerProfile(),
          getCustomerOrders(),
        ])

        if (!isMounted) {
          return
        }

        setProfile(profileResponse.item)
        setOrders(ordersResponse.items.slice(0, 5))
        setErrorMessage(null)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          getApiErrorMessage(error, 'Unable to load your customer dashboard right now.'),
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
    return <LoadingScreen message="Loading your customer dashboard..." />
  }

  if (!profile) {
    return (
      <DashboardCard title="Customer dashboard unavailable">
        <p className="text-sm text-accent-700">
          {errorMessage || 'We could not load your customer dashboard.'}
        </p>
      </DashboardCard>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage your profile, address book, and order history without leaving the NearKart storefront flow behind."
        eyebrow="Customer dashboard"
        title={`Welcome back, ${profile.user.fullName.split(' ')[0]}`}
      />

      {errorMessage ? (
        <div className="rounded-[1.5rem] border border-accent-200 bg-accent-50 px-5 py-4 text-sm font-medium text-accent-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          description="Saved delivery addresses ready for checkout."
          label="Address book"
          value={profile.stats.addressCount}
        />
        <StatCard
          description="Orders linked to your signed-in NearKart account."
          label="Orders"
          value={profile.stats.orderCount}
        />
        <StatCard
          description="Your account is ready for signed-in storefront checkout."
          label="Account"
          value={profile.user.isVerified ? 'Verified' : 'Pending'}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <DashboardCard
          actions={
            <div className="flex flex-wrap gap-2">
              <Link className={getButtonClassName('primary', 'sm')} to="/shops">
                Continue shopping
              </Link>
              <Link
                className={getButtonClassName('secondary', 'sm')}
                to="/dashboard/customer/addresses"
              >
                Manage addresses
              </Link>
            </div>
          }
          description="Keep your identity and default delivery details ready so checkout can prefill them when you need speed."
          title="Profile summary"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-nearkart-100 bg-nearkart-50/70 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Name</p>
              <p className="mt-2 truncate font-semibold text-ink-900">{profile.user.fullName}</p>
            </div>
            <div className="rounded-2xl border border-nearkart-100 bg-nearkart-50/70 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Email</p>
              <p className="mt-2 truncate font-semibold text-ink-900">{profile.user.email}</p>
            </div>
            <div className="rounded-2xl border border-nearkart-100 bg-nearkart-50/70 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Phone</p>
              <p className="mt-2 font-semibold text-ink-900">
                {profile.user.phone || 'Add from profile settings'}
              </p>
            </div>
            <div className="rounded-2xl border border-nearkart-100 bg-nearkart-50/70 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Default address
              </p>
              <p className="mt-2 truncate font-semibold text-ink-900">
                {profile.profile.defaultAddress?.label || 'Not set yet'}
              </p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          description="Your latest orders stay visible here so you can jump back into details or reorder inspiration fast."
          title="Recent orders"
        >
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  className="flex flex-col gap-3 rounded-2xl border border-ink-100 bg-ink-50/60 px-4 py-4 transition duration-150 hover:-translate-y-0.5 hover:border-nearkart-200 hover:bg-white hover:shadow-[var(--shadow-card-hover)]"
                  to={`/orders/${order.id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-sm text-ink-500">{order.shopName}</p>
                    </div>
                    <StatusPill label={order.status.replaceAll('_', ' ')} tone="warning" />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-500">
                    <span>{formatDateTime(order.placedAt)}</span>
                    <span className="font-bold text-nearkart-700">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-6 text-center text-sm text-ink-500">
              No signed-in orders yet. Browse local shops and place your next order to see it here.
            </div>
          )}
        </DashboardCard>
      </section>
    </div>
  )
}
