import { httpClient } from '@/api/http'
import type {
  AddressPrediction,
  AutocompleteResponse,
  GeocodeResponse,
  GeocodeResult,
  ReverseGeocodeResponse,
} from '@/types/location'

/**
 * Client for the backend's read-only Google Maps proxy:
 *   GET /location/autocomplete?input=...&sessionToken=...&language=...&region=...
 *   GET /location/geocode?address=...
 *   GET /location/reverse-geocode?lat=...&lng=...
 *
 * The response envelopes are the confirmed contract (see `src/types/location.ts`), so this file
 * parses them directly instead of guessing at alternate field names/shapes.
 */

interface RequestOptions {
  /** Aborts the request — used so a slow, now-stale autocomplete request can't overwrite a
   * newer one's results. */
  signal?: AbortSignal
}

export async function getAddressPredictions(
  input: string,
  options: RequestOptions & { sessionToken?: string } = {},
): Promise<AddressPrediction[]> {
  if (!input.trim()) {
    return []
  }

  const { data } = await httpClient.get<AutocompleteResponse>('/location/autocomplete', {
    params: {
      input,
      sessionToken: options.sessionToken,
    },
    signal: options.signal,
  })

  return data.predictions
}

export async function geocodeAddress(
  address: string,
  options: RequestOptions = {},
): Promise<GeocodeResult | null> {
  if (!address.trim()) {
    return null
  }

  const { data } = await httpClient.get<GeocodeResponse>('/location/geocode', {
    params: { address },
    signal: options.signal,
  })

  return data.result
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  options: RequestOptions = {},
): Promise<GeocodeResult | null> {
  const { data } = await httpClient.get<ReverseGeocodeResponse>('/location/reverse-geocode', {
    params: { lat: latitude, lng: longitude },
    signal: options.signal,
  })

  return data.result
}
