import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getCustomerOrders } from '@/api/customer'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import type { OrderPreview } from '@/types/order'
import { getApiErrorMessage } from '@/utils/api'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime } from '@/utils/formatDateTime'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from '@/utils/orderStatus'

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadOrders() {
      try {
        const nextOrders = (await getCustomerOrders()).items

        if (!isMounted) {
          return
        }

        setOrders(nextOrders)
        setErrorMessage(null)
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

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="My Orders"
        title="Track your recent purchases"
        description="Monitor the status of your orders and review your shopping history."
      />

      {errorMessage ? (
        <section className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-600">
          {errorMessage}
        </section>
      ) : null}

      <div className="min-h-[500px]">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={`order-skeleton-${index}`}
                className="h-64 animate-pulse rounded-3xl bg-ink-50"
              />
            ))}
          </div>
        ) : errorMessage ? null : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-ink-50 text-5xl">
              📦
            </div>
            <h3 className="font-display text-2xl font-bold text-ink-900">No orders yet</h3>
            <p className="mt-3 max-w-xs text-sm text-ink-400">
              Your order history will appear here once you place your first purchase on NearKart.
            </p>
            <Link
              className="mt-10 inline-flex h-12 items-center justify-center rounded-xl bg-ink-900 px-8 text-sm font-bold text-white transition hover:shadow-lg active:scale-95"
              to="/shops"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <article
                key={order.id}
                className="group relative flex flex-col rounded-3xl border border-ink-100 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-glass"
              >
                <div className="flex flex-1 flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-nearkart-600">
                      {order.shopName}
                    </span>
                    <StatusPill
                      label={ORDER_STATUS_LABELS[order.status]}
                      tone={ORDER_STATUS_TONES[order.status]}
                    />
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-ink-900">
                      #{order.orderNumber}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-ink-400">
                      Placed on {formatDateTime(order.placedAt)}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-ink-50 pt-4">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Total Amount</p>
                      <p className="text-lg font-bold text-ink-900">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>

                    <Link
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-100 text-ink-900 transition hover:bg-ink-50"
                      to={`/orders/${order.id}`}
                    >
                      <span className="sr-only">View Details</span>
                      →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
