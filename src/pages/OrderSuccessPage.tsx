import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'

import { getOrderById } from '@/api/orders'
import type { Order } from '@/types/order'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatWeatherSurchargeLabel } from '@/utils/weatherSurcharge'

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
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-12">
      <div className="mx-auto w-full max-w-2xl text-center">
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-ink-900 text-5xl shadow-glass animate-bounce">
            🎉
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-nearkart-600">
            Success!
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            Order Placed Successfully
          </h1>
          <p className="mt-4 text-lg text-ink-400">
            Your order is now being processed by the shop.
          </p>
        </div>

        {errorMessage ? (
          <section className="mb-8 rounded-2xl border border-accent-100 bg-accent-50/60 p-4 text-sm text-accent-700">
            {errorMessage}
          </section>
        ) : null}

        <div className="rounded-[3rem] border border-ink-100 bg-white p-8 sm:p-12 shadow-glass text-left">
          {isLoading ? (
            <div className="h-48 animate-pulse rounded-2xl bg-ink-50" />
          ) : order ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-ink-50 pb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Order Number</p>
                  <p className="mt-1 text-2xl font-bold text-ink-900">#{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Amount Paid</p>
                  <p className="mt-1 text-2xl font-bold text-nearkart-600">{formatCurrency(order.totalAmount)}</p>
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Shop</p>
                  <p className="font-bold text-ink-900">{order.shopName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Contact Number</p>
                  <p className="font-bold text-ink-900">{order.customerPhone}</p>
                </div>
              </div>

              {order.weatherSurchargeFee > 0 ? (
                <div className="rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900">
                  <span className="font-semibold">
                    {formatWeatherSurchargeLabel(order.weatherCondition)}:
                  </span>{' '}
                  {formatCurrency(order.weatherSurchargeFee)} was added to this order due to
                  live delivery conditions at the time you ordered.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-ink-900 px-8 text-sm font-bold text-white shadow-lg transition hover:shadow-xl active:scale-95 sm:w-auto"
            to={`/orders/${orderId}`}
          >
            Track My Order
          </Link>
          <Link
            className="flex h-14 w-full items-center justify-center rounded-2xl border border-ink-100 bg-white px-8 text-sm font-bold text-ink-700 transition hover:bg-ink-50 active:scale-95 sm:w-auto"
            to="/shops"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
