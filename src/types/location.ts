import type { ApiMeta } from '@/types/api'

/**
 * Shapes for the backend's Google Maps proxy (`GET /location/autocomplete`,
 * `/location/geocode`, `/location/reverse-geocode`). This is the *confirmed* contract — read
 * directly off `NearCart/backend/src/controllers/location.controller.ts` and
 * `services/maps.service.ts` on the parallel branch, not guessed — so keep these in sync with
 * that source if it changes rather than re-introducing lenient parsing here.
 */
export interface AddressPrediction {
  placeId: string
  description: string
  mainText: string
  secondaryText: string | null
}

export interface AutocompleteResponse {
  predictions: AddressPrediction[]
  meta: ApiMeta & { source: string }
}

export interface GeocodeAddressComponents {
  city: string | null
  area: string | null
  pincode: string | null
  state: string | null
  country: string | null
}

export interface GeocodeResult {
  formattedAddress: string
  placeId: string
  latitude: number
  longitude: number
  components: GeocodeAddressComponents
}

export interface GeocodeResponse {
  result: GeocodeResult | null
  meta: ApiMeta & { source: string }
}

export type ReverseGeocodeResponse = GeocodeResponse
