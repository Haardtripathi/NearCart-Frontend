import { useEffect, useState } from 'react'

import { getAdminOrders } from '@/api/admin'
import { PageHeader } from '@/components/PageHeader'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import type { AdminOrderRow } from '@/types/admin'
import { getApiErrorMessage } from '@/utils/api'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime } from '@/utils/formatDateTime'

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadOrders() {
      try {
        const response = await getAdminOrders()

        if (!isMounted) {
          return
        }

        setOrders(response.items)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          getApiErrorMessage(error, 'Unable to load platform orders right now.'),
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
    return <LoadingScreen message="Loading platform orders..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Review every order created across the platform while the public storefront continues to operate."
        eyebrow="Admin orders"
        title="Platform orders"
      />

      <DashboardCard title="Order registry">
        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="pb-3 font-medium">Order</th>
                <th className="pb-3 font-medium">Shop</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Placed</th>
                <th className="pb-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="py-4">
                    <p className="font-semibold text-ink-900">{order.orderNumber}</p>
                    <p className="text-sm text-slate-500">{order.paymentMethod}</p>
                  </td>
                  <td className="py-4">{order.shopName}</td>
                  <td className="py-4">
                    <p>{order.customerName}</p>
                    <p className="text-sm text-slate-500">{order.customerPhone}</p>
                  </td>
                  <td className="py-4">
                    <p>{order.status.replaceAll('_', ' ')}</p>
                    <p className="text-sm text-slate-500">{order.paymentStatus}</p>
                  </td>
                  <td className="py-4">{formatDateTime(order.placedAt)}</td>
                  <td className="py-4 font-semibold text-nearkart-700">
                    {formatCurrency(order.totalAmount)}
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
