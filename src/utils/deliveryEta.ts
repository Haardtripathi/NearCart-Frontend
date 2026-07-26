import type { StatusPillProps } from '@/components/StatusPill'

/**
 * Shared formatting for the live `liveEstimatedDeliveryMinutes` value returned by the backend
 * (`GET /public/shops`, `GET /public/shops/:shopIdOrSlug`, `.../catalog`). Used to render a
 * consistent "~35 min" badge on both the shop list and shop detail pages.
 */
export function formatLiveEta(minutes: number): string {
  return `~${Math.round(minutes)} min`
}

/**
 * Tiered tone so the badge gives a glanceable speed signal, reusing the same success/warning/
 * danger tones `StatusPill` already uses for stock-status badges elsewhere in the app.
 */
export function getLiveEtaTone(minutes: number): StatusPillProps['tone'] {
  if (minutes <= 30) {
    return 'success'
  }

  if (minutes <= 60) {
    return 'warning'
  }

  return 'danger'
}
