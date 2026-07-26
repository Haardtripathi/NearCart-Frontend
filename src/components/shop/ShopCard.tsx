import { Link } from 'react-router-dom'

import { StatusPill } from '@/components/StatusPill'
import type { PublicShopSummary } from '@/types/api'
import { getCategoryIcon } from '@/utils/categoryIcons'
import { formatLiveEta, getLiveEtaTone } from '@/utils/deliveryEta'

interface ShopCardProps {
  shop: PublicShopSummary
}

export function ShopCard({ shop }: ShopCardProps) {
  return (
    <article className="group relative flex flex-col rounded-3xl border border-ink-100 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-glass">
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-nearkart-600">
            <span aria-hidden="true">{getCategoryIcon(shop.category)}</span>
            {shop.category}
          </span>
          <StatusPill
            label={formatLiveEta(shop.liveEstimatedDeliveryMinutes)}
            tone={getLiveEtaTone(shop.liveEstimatedDeliveryMinutes)}
          />
        </div>

        <div>
          <h3 className="font-display text-xl font-bold text-ink-900 group-hover:text-nearkart-600 transition-colors">
            {shop.name}
          </h3>
          <p className="mt-1 text-xs font-medium text-ink-400">
            {[shop.area, shop.city].filter(Boolean).join(' • ')}
          </p>
        </div>

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
        className="mt-6 flex h-11 items-center justify-center rounded-xl bg-nearkart-600 px-6 text-sm font-bold text-white shadow-md shadow-nearkart-600/10 transition hover:bg-nearkart-700 active:scale-95"
        to={`/shops/${shop.slug}`}
      >
        Open Shop
      </Link>
    </article>
  )
}
