import axios from 'axios'

/**
 * Detects the "customer address is outside the shop's delivery radius" error a backend teammate
 * is adding in parallel (haversine check against `Shop.serviceRadiusKm`). The exact error
 * contract wasn't finalized when this was written, so this is intentionally lenient: it accepts
 * any of a `details.code` flag, a `details.distanceKm`/`details.serviceRadiusKm` pair, or the
 * error message itself mentioning delivery range/service area. If the real backend response
 * differs, this is the single place to update the detection rule.
 */

const OUT_OF_RANGE_CODES = new Set([
  'OUT_OF_SERVICE_AREA',
  'ADDRESS_OUT_OF_RANGE',
  'OUTSIDE_DELIVERY_RADIUS',
  'NOT_SERVICEABLE',
])

const OUT_OF_RANGE_MESSAGE_PATTERN =
  /delivery (range|radius|area)|service(able| area)|out(side)? (of )?(the )?(delivery|service) area|doesn't deliver|does not deliver/i

export interface ServiceAreaErrorInfo {
  message: string
  distanceKm: number | null
  radiusKm: number | null
}

export function getServiceAreaErrorInfo(error: unknown): ServiceAreaErrorInfo | null {
  if (!axios.isAxiosError(error)) {
    return null
  }

  const data = error.response?.data as
    | {
        message?: string
        details?: {
          code?: string
          distanceKm?: number
          serviceRadiusKm?: number
          radiusKm?: number
        }
      }
    | undefined

  if (!data) {
    return null
  }

  const message = typeof data.message === 'string' ? data.message : ''
  const code = data.details?.code
  const looksOutOfRange =
    (typeof code === 'string' && OUT_OF_RANGE_CODES.has(code)) ||
    OUT_OF_RANGE_MESSAGE_PATTERN.test(message)

  if (!looksOutOfRange) {
    return null
  }

  const distanceKm = data.details?.distanceKm ?? null
  const radiusKm = data.details?.serviceRadiusKm ?? data.details?.radiusKm ?? null

  return {
    message: message || "This shop doesn't deliver to your address.",
    distanceKm,
    radiusKm,
  }
}

export function formatServiceAreaMessage(info: ServiceAreaErrorInfo): string {
  if (info.distanceKm !== null && info.radiusKm !== null) {
    return `This shop doesn't deliver to your address — you're about ${info.distanceKm.toFixed(1)} km away, outside its ${info.radiusKm.toFixed(1)} km delivery radius.`
  }

  if (info.distanceKm !== null) {
    return `This shop doesn't deliver to your address — you're about ${info.distanceKm.toFixed(1)} km away.`
  }

  return "This shop doesn't deliver to your address. Try a different address or shop."
}
