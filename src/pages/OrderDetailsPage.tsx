import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { cancelOrder, getOrderById } from '@/api/orders'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import { OrderStatusTimeline } from '@/components/order/OrderStatusTimeline'
import { OrderReviewForm, SubmittedOrderReview } from '@/components/order/OrderReviewForm'
import type { Order, OrderReviewSummary } from '@/types/order'
import { getApiErrorMessage } from '@/utils/api'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime } from '@/utils/formatDateTime'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from '@/utils/orderStatus'

export function OrderDetailsPage() {
  const { orderId = '' } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cancelErrorMessage, setCancelErrorMessage] = useState<string | null>(null)

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
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, 'Unable to load order details right now.'))
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

  function handleReviewSubmitted(review: OrderReviewSummary) {
    setOrder((currentOrder) => (currentOrder ? { ...currentOrder, review } : currentOrder))
  }

  async function handleCancelOrder() {
    if (!order) {
      return
    }

    const confirmed = window.confirm(
      `Cancel order #${order.orderNumber}? This can't be undone.`,
    )

    if (!confirmed) {
      return
    }

    setIsCancelling(true)
    setCancelErrorMessage(null)

    try {
      const response = await cancelOrder(order.id)
      setOrder(response.item)
    } catch (error) {
      // 409 means the shop already acted on the order (or it was already cancelled) — surface
      // the backend's own message rather than inventing a different one, same convention as
      // `getServiceAreaErrorInfo`/`formatServiceAreaMessage` use for the delivery-radius error.
      setCancelErrorMessage(
        getApiErrorMessage(error, 'Unable to cancel this order right now.'),
      )
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Order Tracking"
        title={order ? `Order #${order.orderNumber}` : 'Order details'}
        description={order ? `Order placed at ${order.shopName} on ${formatDateTime(order.placedAt)}.` : 'Loading order details...'}
      />

      {errorMessage ? (
        <section className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-600">
          {errorMessage}
        </section>
      ) : null}

      {cancelErrorMessage ? (
        <section className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-600">
          {cancelErrorMessage}
        </section>
      ) : null}

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-[3rem] bg-ink-50" />
      ) : order ? (
        <div className="grid gap-12 lg:grid-cols-[1fr_350px]">
          <div className="space-y-8">
            {/* Status Header */}
            <div className="flex items-center justify-between rounded-[2.5rem] border border-ink-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-nearkart-50 text-3xl">
                  📦
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-nearkart-600">Current Status</p>
                  <div className="mt-1 flex items-center gap-3">
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
                    {order.isCancellable ? (
                      <button
                        className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isCancelling}
                        onClick={() => void handleCancelOrder()}
                        type="button"
                      >
                        {isCancelling ? 'Cancelling…' : 'Cancel order'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Shop Contact</p>
                <p className="text-sm font-bold text-ink-900">{order.shopName}</p>
              </div>
            </div>

            {/* Order status timeline */}
            <div className="rounded-[2.5rem] border border-ink-100 bg-white p-8 shadow-sm">
              <h3 className="mb-6 font-display text-xl font-bold text-ink-900">Order status</h3>
              <OrderStatusTimeline order={order} />
            </div>

            {/* Items List */}
            <div className="rounded-[2.5rem] border border-ink-100 bg-white p-8 shadow-sm">
              <h3 className="mb-6 font-display text-xl font-bold text-ink-900">Items in this order</h3>
              <div className="divide-y divide-ink-50">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-6 py-6 first:pt-0 last:pb-0">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-ink-50">
                      {item.image ? (
                        <img alt={item.name} className="h-full w-full object-cover" src={item.image} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-ink-900 truncate">{item.name}</h4>
                      <p className="text-xs text-ink-400">
                        {[item.brand, item.size].filter(Boolean).join(' • ')} • {item.quantity} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-ink-900">{formatCurrency(item.lineTotal)}</p>
                      <p className="text-[10px] text-ink-400">{formatCurrency(item.price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {order.status === 'DELIVERED' ? (
              order.review ? (
                <SubmittedOrderReview review={order.review} />
              ) : (
                <OrderReviewForm onReviewSubmitted={handleReviewSubmitted} order={order} />
              )
            ) : null}
          </div>

          <aside className="space-y-6">
            {/* Delivery Info */}
            <article className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
              <h4 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-nearkart-600">Delivery Details</h4>
              <div className="space-y-4 text-xs leading-relaxed text-ink-500">
                <div className="space-y-1">
                  <p className="font-bold text-ink-900">{order.customerName}</p>
                  <p>{order.customerPhone}</p>
                  {order.customerEmail && <p>{order.customerEmail}</p>}
                </div>
                <div className="space-y-1 border-t border-ink-50 pt-4">
                  <p>{order.deliveryAddressLine1}</p>
                  {order.deliveryAddressLine2 && <p>{order.deliveryAddressLine2}</p>}
                  <p>{[order.area, order.city].filter(Boolean).join(', ')}</p>
                  <p>{order.pincode}</p>
                </div>
                {order.notes && (
                  <div className="rounded-xl bg-ink-50 p-3 italic">
                    "{order.notes}"
                  </div>
                )}
              </div>
            </article>

            {/* Payment Summary */}
            <article className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
              <div className="bg-ink-50/50 px-6 py-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Order Summary</h4>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-400">Subtotal</span>
                    <span className="font-bold text-ink-900">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-400">Payment</span>
                    <span className="font-bold text-ink-900 uppercase tracking-tight">{order.paymentMethod.replaceAll('_', ' ')}</span>
                  </div>
                </div>
                <div className="rounded-xl bg-ink-900 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Total Amount</span>
                    <span className="text-lg font-bold">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
                <Link
                  className="flex h-11 items-center justify-center rounded-xl border border-ink-100 bg-white text-xs font-bold text-ink-700 transition hover:bg-ink-50 active:scale-95"
                  to="/shops"
                >
                  Return to Shops
                </Link>
              </div>
            </article>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
