import axios from 'axios'

/**
 * Detects the "customer address is outside the shop's delivery radius" error.
 *
 * Confirmed against the backend (`assertWithinServiceArea` in
 * `NearCart/backend/src/services/orders.service.ts` on the parallel branch): it throws via
 * `createHttpError(400, message, { distanceKm, allowedRadiusKm })`, and the shared error
 * middleware serializes that as `{ success: false, message, details: { distanceKm,
 * allowedRadiusKm }, meta }`. There is no `code`/`error` discriminator field anywhere in that
 * response — `details.distanceKm` + `details.allowedRadiusKm` both being present on a 400 is the
 * only reliable signature, so that's what we key off instead of guessing at an error code or
 * sniffing the human-readable message text (which doesn't contain any of "radius"/"service
 * area"/"doesn't deliver" wording and would never have matched a keyword-based check).
 */

export interface ServiceAreaErrorInfo {
  message: string
  distanceKm: number | null
  radiusKm: number | null
}

export function getServiceAreaErrorInfo(error: unknown): ServiceAreaErrorInfo | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 400) {
    return null
  }

  const data = error.response.data as
    | {
        message?: string
        details?: {
          distanceKm?: number
          allowedRadiusKm?: number
        }
      }
    | undefined

  const distanceKm =
    typeof data?.details?.distanceKm === 'number' ? data.details.distanceKm : null
  const radiusKm =
    typeof data?.details?.allowedRadiusKm === 'number' ? data.details.allowedRadiusKm : null

  if (distanceKm === null || radiusKm === null) {
    return null
  }

  const message =
    typeof data?.message === 'string' && data.message
      ? data.message
      : "This shop doesn't deliver to your address."

  return { message, distanceKm, radiusKm }
}

export function formatServiceAreaMessage(info: ServiceAreaErrorInfo): string {
  if (info.distanceKm !== null && info.radiusKm !== null) {
    return `This shop doesn't deliver to your address — you're about ${info.distanceKm.toFixed(1)} km away, outside its ${info.radiusKm.toFixed(1)} km delivery radius.`
  }

  return "This shop doesn't deliver to your address. Try a different address or shop."
}
