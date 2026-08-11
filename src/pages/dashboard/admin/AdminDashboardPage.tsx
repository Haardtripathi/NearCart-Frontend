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
import { getButtonClassName } from '@/components/shared/Button'
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
        <p className="text-sm text-accent-700">
          {errorMessage || 'We could not load the admin dashboard.'}
        </p>
      </DashboardCard>
    )
  }

  return (
    <div className="space-y-6 animate-nk-fade-in">
      <div className="animate-nk-fade-slide-up">
        <PageHeader
          description="Monitor platform users, shop approvals, and order flow from the NearKart control center."
          eyebrow="Admin dashboard"
          title="Platform command center"
        />
      </div>

      {errorMessage ? (
        <div className="animate-nk-shake rounded-[1.5rem] border border-accent-200 bg-accent-50 px-5 py-4 text-sm text-accent-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="animate-nk-fade-slide-up nk-stagger-1">
          <StatCard
            description="All active platform users across customers, merchants, and admins."
            label="Users"
            value={summary.userCount}
          />
        </div>
        <div className="animate-nk-fade-slide-up nk-stagger-2">
          <StatCard
            description="Database-backed shops currently registered in NearKart."
            label="Shops"
            value={summary.shopCount}
          />
        </div>
        <div className="animate-nk-fade-slide-up nk-stagger-3">
          <StatCard
            description="Merchant shops that still need an admin approval decision."
            label="Pending approvals"
            value={summary.pendingApprovalCount}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-nk-fade-slide-up nk-stagger-3">
          <DashboardCard
            actions={
              <div className="flex flex-wrap gap-2">
                <Link className={getButtonClassName('secondary', 'sm')} to="/dashboard/admin/users">
                  Review users
                </Link>
                <Link className={getButtonClassName('primary', 'sm')} to="/dashboard/admin/approvals">
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
              ].map((point, index) => (
                <div
                  key={point}
                  className={`animate-nk-fade-slide-up nk-stagger-${index + 4} rounded-[1.35rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600 transition-colors duration-200 hover:bg-nearkart-50`}
                >
                  {point}
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        <div className="animate-nk-fade-slide-up nk-stagger-4">
          <DashboardCard
            description="Recent order activity across the platform."
            title="Recent orders"
          >
            {summary.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {summary.recentOrders.map((order, index) => (
                  <div
                    key={order.id}
                    className={`animate-nk-fade-slide-up nk-stagger-${Math.min(index + 1, 6)} rounded-[1.35rem] border border-slate-100 bg-slate-50/80 px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-nearkart-200 hover:shadow-[var(--shadow-card)]`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink-900">{order.orderNumber}</p>
                        <p className="text-sm text-slate-500">{order.shopName}</p>
                      </div>
                      <p className="font-semibold text-nearkart-700">
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
              <div className="animate-nk-fade-in rounded-[1.35rem] bg-slate-50 px-4 py-5 text-sm text-slate-600">
                No platform orders yet. They will start appearing here as customers place them.
              </div>
            )}
          </DashboardCard>
        </div>
      </section>
    </div>
  )
}
