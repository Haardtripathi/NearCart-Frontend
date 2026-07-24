import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getOrderById } from '@/api/orders'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import { OrderStatusTimeline } from '@/components/order/OrderStatusTimeline'
import type { Order } from '@/types/order'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime } from '@/utils/formatDateTime'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from '@/utils/orderStatus'

export function OrderDetailsPage() {
  const { orderId = '' } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadOrder = useCallback(
    async ({ silent }: { silent: boolean }) => {
      if (!orderId) {
        return
      }

      if (silent) {
        setIsRefreshing(true)
      }

      try {
        const response = await getOrderById(orderId)
        setOrder(response.item)
        setErrorMessage(null)
      } catch {
        setErrorMessage('Unable to load order details right now.')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [orderId],
  )

  useEffect(() => {
    void loadOrder({ silent: false })
    // Status changes are synced by a shop's back-office on its own schedule — no live/websocket
    // updates in Phase 1, so re-fetch on mount/navigation and let the visitor use "Refresh
    // status" (below) to check again without a full page reload.
  }, [loadOrder])

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Order details"
        title={order ? order.orderNumber : 'Order details'}
        description="See the full order, including delivery details, item quantities, and the final total you placed."
      />

      {errorMessage ? (
        <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      {isLoading ? (
        <section className="h-96 animate-pulse rounded-[1.75rem] border border-white/80 bg-white/80" />
      ) : order ? (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <article className="rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-nearkart-600">
                    {order.shopName}
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-ink-900">
                    {order.orderNumber}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill
                    label={ORDER_STATUS_LABELS[order.status]}
                    tone={ORDER_STATUS_TONES[order.status]}
                  />
                  <button
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-nearkart-200 hover:text-nearkart-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isRefreshing}
                    onClick={() => void loadOrder({ silent: true })}
                    type="button"
                  >
                    {isRefreshing ? 'Refreshing…' : 'Refresh status'}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Placed at</p>
                  <p className="mt-1 font-semibold text-ink-900">
                    {formatDateTime(order.placedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Payment method</p>
                  <p className="mt-1 font-semibold text-ink-900">
                    {order.paymentMethod.replaceAll('_', ' ')}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
              <h3 className="font-display text-2xl text-ink-900">Order status</h3>
              <div className="mt-5">
                <OrderStatusTimeline order={order} />
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
              <h3 className="font-display text-2xl text-ink-900">
                Items ordered
              </h3>
              <div className="mt-5 space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-[1.35rem] border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="h-20 w-20 overflow-hidden rounded-[1rem] bg-white">
                      {item.image ? (
                        <img
                          alt={item.name}
                          className="h-full w-full object-cover"
                          src={item.image}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-ink-900">{item.name}</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {[item.brand, item.size].filter(Boolean).join(' • ')}
                      </p>
                    </div>

                    <div className="text-sm text-slate-600">
                      {item.quantity} x {formatCurrency(item.price)}
                    </div>
                    <div className="text-base font-semibold text-ink-900">
                      {formatCurrency(item.lineTotal)}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="space-y-4">
            <article className="rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
              <h3 className="font-display text-2xl text-ink-900">
                Delivery details
              </h3>
              <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
                <p>
                  <span className="font-semibold text-ink-900">
                    {order.customerName}
                  </span>
                  <br />
                  {order.customerPhone}
                  {order.customerEmail ? (
                    <>
                      <br />
                      {order.customerEmail}
                    </>
                  ) : null}
                </p>
                <p>
                  {order.deliveryAddressLine1}
                  {order.deliveryAddressLine2 ? (
                    <>
                      <br />
                      {order.deliveryAddressLine2}
                    </>
                  ) : null}
                  <br />
                  {[order.area, order.city].filter(Boolean).join(', ')}
                  <br />
                  {order.pincode}
                </p>
                {order.notes ? (
                  <p>
                    <span className="font-semibold text-ink-900">Notes:</span>{' '}
                    {order.notes}
                  </p>
                ) : null}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-white/80 bg-white/95 p-6 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.45)]">
              <h3 className="font-display text-2xl text-ink-900">Summary</h3>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink-900">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base text-slate-700">
                  <span>Total</span>
                  <span className="font-semibold text-nearkart-700">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>

              <Link
                className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-nearkart-200 hover:text-nearkart-700"
                to="/shops"
              >
                Continue shopping
              </Link>
            </article>
          </aside>
        </section>
      ) : null}
    </div>
  )
}
