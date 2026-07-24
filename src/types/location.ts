import type { ApiMeta } from '@/types/api'

/**
 * Shapes for the backend "marketplace-safe" location proxy
 * (`GET /location/autocomplete`, `/location/geocode`, `/location/reverse-geocode`).
 *
 * These endpoints are being built in parallel in NearCart/backend and did not exist yet when this
 * client was written — field names below are this frontend's best-guess contract, kept as close
 * to the raw Google Places/Geocoding response shape as possible so reconciliation is a rename, not
 * a rewrite. `parseAutocompletePrediction`/`parseGeocodeResult` in `src/api/location.ts` are the
 * single place to adjust if the real response differs.
 */
export interface AddressPrediction {
  placeId: string
  description: string
  mainText?: string
  secondaryText?: string
}

export interface AutocompleteResponse {
  predictions: AddressPrediction[]
  meta?: ApiMeta
}

export interface GeocodeAddressComponents {
  line1?: string
  city?: string
  area?: string
  pincode?: string
  landmark?: string
}

export interface GeocodeResult {
  formattedAddress: string
  latitude: number
  longitude: number
  addressComponents?: GeocodeAddressComponents
}

export interface GeocodeResponse {
  result: GeocodeResult
  meta?: ApiMeta
}

export interface ReverseGeocodeResponse {
  result: GeocodeResult
  meta?: ApiMeta
}
