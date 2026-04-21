import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getCustomerOrders } from '@/api/customer'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import type { OrderPreview } from '@/types/order'
import { getApiErrorMessage } from '@/utils/api'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime } from '@/utils/formatDateTime'

export function CustomerOrdersPage() {
  const [orders, setOrders] = useState<OrderPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadOrders() {
      try {
        const response = await getCustomerOrders()

        if (!isMounted) {
          return
        }

        setOrders(response.items)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          getApiErrorMessage(error, 'Unable to load your orders right now.'),
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadOrders()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return <LoadingScreen message="Loading your customer orders..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Review every signed-in order attached to your NearKart account and jump back into full order details whenever needed."
        eyebrow="Customer orders"
        title="Order history"
      />

      <DashboardCard title="Your orders">
        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Shop</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Placed</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-4 font-semibold text-ink-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-4">{order.shopName}</td>
                    <td className="py-4">
                      <StatusPill
                        label={order.status.replaceAll('_', ' ')}
                        tone="warning"
                      />
                    </td>
                    <td className="py-4">{formatDateTime(order.placedAt)}</td>
                    <td className="py-4 font-semibold text-nearkart-700">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-4">
                      <Link
                        className="font-semibold text-nearkart-700"
                        to={`/orders/${order.id}`}
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-[1.35rem] bg-slate-50 px-4 py-5 text-sm text-slate-600">
            No signed-in orders yet. Use the storefront to place your next order and it will appear here.
          </div>
        )}
      </DashboardCard>
    </div>
  )
}
