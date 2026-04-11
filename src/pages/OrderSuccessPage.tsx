import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'

import { getOrderById } from '@/api/orders'
import { PageHeader } from '@/components/PageHeader'
import type { Order } from '@/types/order'
import { formatCurrency } from '@/utils/formatCurrency'

export function OrderSuccessPage() {
  const { orderId } = useParams()
  const location = useLocation()
  const initialOrder = (location.state as { order?: Order } | null)?.order ?? null
  const [order, setOrder] = useState<Order | null>(initialOrder)
  const [isLoading, setIsLoading] = useState(!initialOrder)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadOrder() {
      if (!orderId || initialOrder) {
        return
      }

      try {
        const response = await getOrderById(orderId)

        if (!isMounted) {
          return
        }

        setOrder(response.item)
        setErrorMessage(null)
      } catch {
        if (!isMounted) {
          return
        }

        setErrorMessage('Unable to load the placed order right now.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadOrder()

    return () => {
      isMounted = false
    }
  }, [initialOrder, orderId])

  if (!orderId) {
    return <Navigate replace to="/orders" />
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Order placed"
        title="Your order was placed successfully."
        description="Your order is in, and you can review the details or keep shopping for more household essentials."
      />

      {errorMessage ? (
        <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-[1.5rem] bg-slate-100" />
          ) : order ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
                  Order summary
                </p>
                <h2 className="mt-3 font-display text-3xl text-ink-900">
                  {order.orderNumber}
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.35rem] bg-nearcart-50 p-4">
                  <p className="text-sm text-slate-500">Customer</p>
                  <p className="mt-2 font-semibold text-ink-900">
                    {order.customerName}
                  </p>
                </div>
                <div className="rounded-[1.35rem] bg-nearcart-50 p-4">
                  <p className="text-sm text-slate-500">Shop</p>
                  <p className="mt-2 font-semibold text-ink-900">
                    {order.shopName}
                  </p>
                </div>
                <div className="rounded-[1.35rem] bg-nearcart-50 p-4">
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="mt-2 font-semibold text-ink-900">
                    {order.status}
                  </p>
                </div>
                <div className="rounded-[1.35rem] bg-nearcart-50 p-4">
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="mt-2 font-semibold text-ink-900">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </article>

        <article className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearcart-600">
            Next actions
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-nearcart-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-nearcart-700"
              to={`/orders/${orderId}`}
            >
              View order details
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-nearcart-200 hover:text-nearcart-700"
              to="/shops"
            >
              Continue shopping
            </Link>
          </div>
        </article>
      </section>
    </div>
  )
}
