import { Link } from 'react-router-dom'

import { StatusPill } from '@/components/StatusPill'
import type { PublicShopSummary } from '@/types/api'
import { getCategoryIcon } from '@/utils/categoryIcons'
import { formatLiveEta, getLiveEtaTone } from '@/utils/deliveryEta'
import { getTodayStatusLabel, getTodayStatusMessage, getTodayStatusTone } from '@/utils/shopAvailability'

interface ShopCardProps {
  shop: PublicShopSummary
}

export function ShopCard({ shop }: ShopCardProps) {
  const isOpenToday = shop.todayStatus === 'OPEN'
  const todayStatusMessage = getTodayStatusMessage(shop)

  return (
    <article
      className={`group relative flex flex-col rounded-3xl border border-ink-100 bg-white p-6 shadow-[var(--shadow-card)] transition-all ${isOpenToday ? 'hover:-translate-y-1 hover:shadow-glass' : 'opacity-80'
        }`}
    >
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-nearkart-600">
            <span aria-hidden="true">{getCategoryIcon(shop.category)}</span>
            {shop.category}
          </span>
          {isOpenToday ? (
            <StatusPill
              label={formatLiveEta(shop.liveEstimatedDeliveryMinutes)}
              tone={getLiveEtaTone(shop.liveEstimatedDeliveryMinutes)}
            />
          ) : (
            <StatusPill
              label={getTodayStatusLabel(shop.todayStatus)}
              tone={getTodayStatusTone(shop.todayStatus)}
            />
          )}
        </div>

        <div>
          <h3 className="font-display text-xl font-bold text-ink-900 group-hover:text-nearkart-600 transition-colors">
            {shop.name}
          </h3>
          <p className="mt-1 text-xs font-medium text-ink-400">
            {[shop.area, shop.city].filter(Boolean).join(' • ')}
            {shop.distanceKm != null ? (
              <span className="font-bold text-nearkart-600"> • {shop.distanceKm} km away</span>
            ) : null}
          </p>
        </div>

        {todayStatusMessage ? (
          <div
            className={`rounded-xl px-4 py-2.5 text-xs font-medium leading-relaxed ${shop.todayStatus === 'CLOSED'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-amber-50 text-amber-800'
              }`}
          >
            {todayStatusMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-ink-50/50 p-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Live ETA</p>
            <p className="text-sm font-bold text-ink-900">
              {formatLiveEta(shop.liveEstimatedDeliveryMinutes)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Min. Order</p>
            <p className="text-sm font-bold text-ink-900">
              ₹{shop.minimumOrderAmount}
            </p>
          </div>
        </div>

        {shop.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-500">
            {shop.description}
          </p>
        )}
      </div>

      <Link
        className={`mt-6 flex h-11 items-center justify-center rounded-xl px-6 text-sm font-bold shadow-md transition active:scale-95 ${isOpenToday
            ? 'bg-nearkart-600 text-white shadow-nearkart-600/10 hover:bg-nearkart-700'
            : 'bg-ink-50 text-ink-500 shadow-none hover:bg-ink-100'
          }`}
        to={`/shops/${shop.slug}`}
      >
        {isOpenToday ? 'Open Shop' : 'View Shop'}
      </Link>
    </article>
  )
}
