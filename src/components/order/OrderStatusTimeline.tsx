import type { Order, OrderStatus } from '@/types/order'
import { formatDateTime } from '@/utils/formatDateTime'

const HAPPY_PATH: Array<{ status: OrderStatus; label: string; description: string }> = [
  {
    status: 'PENDING_CONFIRMATION',
    label: 'Order placed',
    description: 'Waiting for the shop to confirm your order.',
  },
  {
    status: 'ACCEPTED',
    label: 'Confirmed',
    description: 'The shop has accepted your order.',
  },
  {
    status: 'PREPARING',
    label: 'Preparing',
    description: 'Your order is being packed.',
  },
  {
    status: 'READY_FOR_PICKUP',
    label: 'Ready',
    description: 'Ready for pickup or handover to delivery.',
  },
  {
    status: 'OUT_FOR_DELIVERY',
    label: 'Out for delivery',
    description: 'Your order is on its way.',
  },
  {
    status: 'DELIVERED',
    label: 'Delivered',
    description: 'Order delivered. Enjoy!',
  },
]

const TERMINAL_NEGATIVE_STATUSES = new Set<OrderStatus>(['REJECTED', 'CANCELLED'])

function getStepTimestamp(order: Order, status: OrderStatus): string | null {
  if (status === 'PENDING_CONFIRMATION') {
    return order.placedAt
  }

  if (status === 'ACCEPTED') {
    return order.acceptedAt
  }

  if (status === 'DELIVERED') {
    return order.deliveredAt
  }

  return null
}

interface OrderStatusTimelineProps {
  order: Order
}

export function OrderStatusTimeline({ order }: OrderStatusTimelineProps) {
  const isTerminalNegative = TERMINAL_NEGATIVE_STATUSES.has(order.status)
  const currentIndex = HAPPY_PATH.findIndex((step) => step.status === order.status)
  // If the order was rejected/cancelled we don't know exactly which step it stopped at from the
  // status alone — treat "placed" as the only guaranteed-complete step and show the rest as
  // stopped, rather than guessing a false progress point.
  const lastCompletedIndex = isTerminalNegative ? 0 : currentIndex

  return (
    <div className="space-y-5">
      {isTerminalNegative ? (
        <div className="flex items-start gap-3 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-900">
          <span className="mt-0.5 text-lg">⚠️</span>
          <div>
            <p className="font-semibold">
              {order.status === 'REJECTED' ? 'Order was rejected by the shop.' : 'Order was cancelled.'}
            </p>
            <p className="mt-1 text-accent-700">
              {order.status === 'REJECTED'
                ? 'The shop was unable to confirm this order. Any payment collected on delivery does not apply.'
                : 'This order will not be fulfilled.'}
            </p>
          </div>
        </div>
      ) : null}

      <ol className="space-y-0">
        {HAPPY_PATH.map((step, index) => {
          const isDone = index <= lastCompletedIndex && !isTerminalNegative
          const isCurrent = index === currentIndex && !isTerminalNegative
          const isStoppedBefore = isTerminalNegative && index > lastCompletedIndex
          const timestamp = getStepTimestamp(order, step.status)
          const isLastStep = index === HAPPY_PATH.length - 1

          return (
            <li className="flex gap-4" key={step.status}>
              <div className="flex flex-col items-center">
                <span
                  className={[
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    isDone
                      ? 'bg-nearkart-600 text-white shadow-sm shadow-nearkart-600/30'
                      : isCurrent
                        ? 'bg-nearkart-100 text-nearkart-700 ring-2 ring-nearkart-400 animate-pulse'
                        : isStoppedBefore
                          ? 'bg-accent-100 text-accent-400'
                          : 'bg-ink-100 text-ink-400',
                  ].join(' ')}
                >
                  {isDone ? '✓' : index + 1}
                </span>
                {!isLastStep ? (
                  <span
                    className={[
                      'my-1 w-px flex-1',
                      isDone && index < lastCompletedIndex
                        ? 'bg-nearkart-400'
                        : 'bg-ink-200',
                    ].join(' ')}
                  />
                ) : null}
              </div>

              <div className={isLastStep ? 'pb-0' : 'pb-6'}>
                <p
                  className={[
                    'text-sm font-semibold',
                    isDone || isCurrent
                      ? 'text-ink-900'
                      : isStoppedBefore
                        ? 'text-accent-400'
                        : 'text-ink-400',
                  ].join(' ')}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-sm text-ink-500">{step.description}</p>
                {timestamp ? (
                  <p className="mt-1 text-xs font-medium text-ink-400">
                    {formatDateTime(timestamp)}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
