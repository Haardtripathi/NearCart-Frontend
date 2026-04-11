import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getAdminOrders,
  getAdminShops,
  getAdminUsers,
  getPendingApprovals,
} from '@/api/admin'
import { PageHeader } from '@/components/PageHeader'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { StatCard } from '@/components/dashboard/StatCard'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import type { AdminOrderRow } from '@/types/admin'
import { getApiErrorMessage } from '@/utils/api'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime } from '@/utils/formatDateTime'

interface AdminSummary {
  userCount: number
  shopCount: number
  pendingApprovalCount: number
  recentOrders: AdminOrderRow[]
}

export function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        const [usersResponse, shopsResponse, approvalsResponse, ordersResponse] =
          await Promise.all([
            getAdminUsers(),
            getAdminShops(),
            getPendingApprovals(),
            getAdminOrders(),
          ])

        if (!isMounted) {
          return
        }

        setSummary({
          userCount: usersResponse.meta.total,
          shopCount: shopsResponse.meta.total,
          pendingApprovalCount: approvalsResponse.meta.total,
          recentOrders: ordersResponse.items.slice(0, 5),
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          getApiErrorMessage(error, 'Unable to load the admin dashboard right now.'),
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
    return <LoadingScreen message="Loading the admin dashboard..." />
  }

  if (!summary) {
    return (
      <DashboardCard title="Admin dashboard unavailable">
        <p className="text-sm text-rose-700">
          {errorMessage || 'We could not load the admin dashboard.'}
        </p>
      </DashboardCard>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Monitor platform users, shop approvals, and order flow from the NearCart control center."
        eyebrow="Admin dashboard"
        title="Platform command center"
      />

      {errorMessage ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          description="All active platform users across customers, merchants, and admins."
          label="Users"
          value={summary.userCount}
        />
        <StatCard
          description="Database-backed shops currently registered in NearCart."
          label="Shops"
          value={summary.shopCount}
        />
        <StatCard
          description="Merchant shops that still need an admin approval decision."
          label="Pending approvals"
          value={summary.pendingApprovalCount}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <DashboardCard
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-nearcart-200 hover:text-nearcart-700"
                to="/dashboard/admin/users"
              >
                Review users
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full bg-nearcart-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-nearcart-700"
                to="/dashboard/admin/approvals"
              >
                Open approvals
              </Link>
            </div>
          }
          description="Use the admin workspace to approve merchant shops, audit user growth, and prepare the platform for future payment and delivery modules."
          title="Quick actions"
        >
          <div className="grid gap-3 md:grid-cols-3">
            {[
              'Approve or reject newly submitted shops.',
              'Review user roles and merchant account readiness.',
              'Inspect the latest cross-platform order activity.',
            ].map((point) => (
              <div
                key={point}
                className="rounded-[1.35rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600"
              >
                {point}
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard
          description="Recent order activity across the platform."
          title="Recent orders"
        >
          {summary.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {summary.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-[1.35rem] border border-slate-100 bg-slate-50/80 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">{order.orderNumber}</p>
                      <p className="text-sm text-slate-500">{order.shopName}</p>
                    </div>
                    <p className="font-semibold text-nearcart-700">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <span>{formatDateTime(order.placedAt)}</span>
                    <span>{order.status.replaceAll('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.35rem] bg-slate-50 px-4 py-5 text-sm text-slate-600">
              No platform orders yet. They will start appearing here as customers place them.
            </div>
          )}
        </DashboardCard>
      </section>
    </div>
  )
}
