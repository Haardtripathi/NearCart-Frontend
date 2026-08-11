import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { getCustomerOrders } from '@/api/customer'
import { PageHeader } from '@/components/PageHeader'
import { StatusPill } from '@/components/StatusPill'
import type { OrderPreview } from '@/types/order'
import { getApiErrorMessage } from '@/utils/api'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDateTime } from '@/utils/formatDateTime'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from '@/utils/orderStatus'

// Mirrors the backend's `TERMINAL_ORDER_STATUSES` (`orders.service.ts`) and the same set used in
// `OrderDetailsPage.tsx` — an order in one of these states never changes again, so it shouldn't
// keep this list polling.
const TERMINAL_ORDER_STATUSES = new Set<OrderPreview['status']>([
  'DELIVERED',
  'REJECTED',
  'CANCELLED',
])

// Same interval as `OrderDetailsPage.tsx`'s per-order polling — see that file's comment for the
// reasoning (no websocket/SSE server exists yet; this closes most of the "is this stale?" gap
// cheaply for a visitor with their order list open).
const ORDER_LIST_POLL_INTERVAL_MS = 18_000

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  // Read fresh inside the interval callback below without making the interval-setup effect
  // depend on (and re-run for) every `orders` update — same "ref, not a dependency" pattern used
  // for `itemsRef`/`formValuesRef` in `CheckoutPage.tsx`.
  const ordersRef = useRef(orders)
  ordersRef.current = orders

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    async function loadOrders({ silent }: { silent: boolean }) {
      if (!silent) {
        setIsLoading(true)
      }

      try {
        const nextOrders = (await getCustomerOrders()).items

        if (!isMountedRef.current) {
          return
        }

        setOrders(nextOrders)
        setErrorMessage(null)
      } catch (error) {
        if (!isMountedRef.current) {
          return
        }

        // Only surface the error on the initial (non-silent) load — a background poll hiccup
        // shouldn't replace an already-visible, still-valid order list with an error banner.
        if (!silent) {
          setErrorMessage(
            getApiErrorMessage(error, 'Unable to load your orders right now.'),
          )
        }
      } finally {
        if (isMountedRef.current && !silent) {
          setIsLoading(false)
        }
      }
    }

    void loadOrders({ silent: false })

    const intervalId = window.setInterval(() => {
      const currentOrders = ordersRef.current

      // Nothing left that could still change (empty list, or every order already terminal) —
      // skip the network call rather than polling forever with no possible-to-observe effect.
      // Doesn't clear the interval itself: a customer could place a brand-new order in another
      // tab while this one sits open, and the next tick should pick that up.
      if (currentOrders.length > 0 && currentOrders.every((order) => TERMINAL_ORDER_STATUSES.has(order.status))) {
        return
      }

      void loadOrders({ silent: true })
    }, ORDER_LIST_POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
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
        <section className="rounded-2xl border border-accent-100 bg-accent-50/60 p-4 text-sm text-accent-700">
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
