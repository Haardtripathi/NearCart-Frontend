import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'

import { getOrderById } from '@/api/orders'
import type { Order } from '@/types/order'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatWeatherSurchargeLabel } from '@/utils/weatherSurcharge'

// One-shot celebratory burst, small colored squares flung outward from the success icon and
// fading out — fixed (not random) offsets so the burst looks deliberate rather than jittery.
// Entirely skipped under `prefers-reduced-motion` (not just sped up) per this app's motion
// convention, matching every other `useReducedMotion()` gate in the codebase.
const CONFETTI_PARTICLES: Array<{ x: number; y: number; rotate: number; delay: number; className: string }> = [
  { x: -58, y: -78, rotate: -35, delay: 0, className: 'bg-nearkart-500' },
  { x: 52, y: -88, rotate: 24, delay: 0.03, className: 'bg-accent-500' },
  { x: -92, y: -34, rotate: 60, delay: 0.07, className: 'bg-sun-400' },
  { x: 90, y: -46, rotate: -50, delay: 0.02, className: 'bg-nearkart-400' },
  { x: -28, y: -108, rotate: 12, delay: 0.09, className: 'bg-accent-400' },
  { x: 30, y: -112, rotate: -20, delay: 0.05, className: 'bg-sun-500' },
  { x: -110, y: -6, rotate: 80, delay: 0.11, className: 'bg-nearkart-600' },
  { x: 108, y: 2, rotate: -80, delay: 0.06, className: 'bg-accent-600' },
  { x: -14, y: -128, rotate: 45, delay: 0.13, className: 'bg-sun-300' },
  { x: 16, y: -132, rotate: -45, delay: 0.1, className: 'bg-nearkart-300' },
]

function OrderSuccessConfetti() {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return null
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {CONFETTI_PARTICLES.map((particle, index) => (
        <motion.span
          animate={{ opacity: 0, x: particle.x, y: particle.y, rotate: particle.rotate, scale: 1 }}
          className={`absolute h-2.5 w-2.5 rounded-sm ${particle.className}`}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 0.6 }}
          key={index}
          transition={{ duration: 0.9, delay: particle.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

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
          <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-ink-900 text-5xl shadow-glass animate-bounce">
            🎉
            <OrderSuccessConfetti />
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
