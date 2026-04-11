import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getCustomerOrders } from '@/api/customer'
import { getOrderById } from '@/api/orders'
import { PageHeader } from '@/components/PageHeader'
import { useAuthStore } from '@/store/authStore'
import type { OrderPreview } from '@/types/order'
import { getApiErrorMessage } from '@/utils/api'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime } from '@/utils/formatDateTime'
import { getGuestOrderIds } from '@/utils/guestOrders'

async function getGuestOrders() {
  const guestOrderIds = getGuestOrderIds()

  if (guestOrderIds.length === 0) {
    return [] as OrderPreview[]
  }

  const orders = await Promise.all(
    guestOrderIds.map(async (orderId) => {
      const response = await getOrderById(orderId)

      return {
        id: response.item.id,
        orderNumber: response.item.orderNumber,
        customerUserId: response.item.customerUserId,
        shopId: response.item.shopId,
        shopName: response.item.shopName,
        status: response.item.status,
        paymentStatus: response.item.paymentStatus,
        paymentMethod: response.item.paymentMethod,
        totalAmount: response.item.totalAmount,
        customerName: response.item.customerName,
        placedAt: response.item.placedAt,
        deliveredAt: response.item.deliveredAt,
      } satisfies OrderPreview
    }),
  )

  return orders.sort((left, right) => {
    return new Date(right.placedAt).getTime() - new Date(left.placedAt).getTime()
  })
}

export function OrdersPage() {
  const user = useAuthStore((state) => state.user)
  const [orders, setOrders] = useState<OrderPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadOrders() {
      try {
        const nextOrders =
          user?.role === 'CUSTOMER'
            ? (await getCustomerOrders()).items
            : await getGuestOrders()

        if (!isMounted) {
          return
        }

        setOrders(nextOrders)
        setErrorMessage(null)
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (user?.role === 'CUSTOMER') {
          setErrorMessage(
            getApiErrorMessage(error, 'Unable to load your orders right now.'),
          )
          return
        }

        setErrorMessage(
          getApiErrorMessage(error, 'Unable to load your saved guest orders right now.'),
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
  }, [user])

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Orders"
        title="Track your recent orders."
        description={
          user?.role === 'CUSTOMER'
            ? 'See the latest signed-in orders attached to your NearCart account.'
            : 'See the orders saved on this device from your guest storefront flow.'
        }
      />

      {errorMessage ? (
        <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }, (_, index) => (
              <div
                key={`order-skeleton-${index}`}
                className="h-64 animate-pulse rounded-[1.75rem] border border-white/80 bg-white/75"
              />
            ))
          : orders.map((order) => (
              <article
                key={order.id}
                className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
                  {order.shopName}
                </p>
                <h2 className="mt-3 font-display text-2xl text-ink-900">
                  {order.orderNumber}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{order.status}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {formatDateTime(order.placedAt)}
                </p>
                <div className="mt-6 rounded-2xl bg-nearcart-50 px-4 py-3 text-sm text-slate-700">
                  Total:{' '}
                  <span className="font-semibold">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <Link
                  className="mt-6 inline-flex rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-nearcart-200 hover:text-nearcart-700"
                  to={`/orders/${order.id}`}
                >
                  View details
                </Link>
              </article>
            ))}
      </section>

      {!isLoading && orders.length === 0 ? (
        <article className="rounded-[1.75rem] border border-white/80 bg-white/90 p-8 text-center shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
          <p className="text-sm leading-7 text-slate-600">
            {user?.role === 'CUSTOMER'
              ? 'No signed-in orders yet. Place your next NearCart order and it will show up here.'
              : 'No saved guest orders yet. Place an order from the storefront and it will show up here on this device.'}
          </p>
        </article>
      ) : null}
    </div>
  )
}
