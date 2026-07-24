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
 *   GET /location/autocomplete?input=...
 *   GET /location/geocode?address=...
 *   GET /location/reverse-geocode?lat=...&lng=...
 *
 * A backend teammate is adding these in parallel (they may not exist yet). The parsers below are
 * intentionally lenient about the exact response envelope (`predictions` vs `items`, `result` vs
 * `data`, snake_case vs camelCase lat/lng) so this file is the only spot to adjust once the real
 * contract lands, instead of every call site.
 */

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value

  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null
}

function normalizePrediction(raw: unknown): AddressPrediction | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const record = raw as Record<string, unknown>
  const placeId = record.placeId ?? record.place_id ?? record.id
  const description = record.description ?? record.formattedAddress ?? record.text

  if (typeof placeId !== 'string' || typeof description !== 'string') {
    return null
  }

  const structured = record.structuredFormatting as
    | Record<string, unknown>
    | undefined

  return {
    placeId,
    description,
    mainText:
      typeof record.mainText === 'string'
        ? record.mainText
        : typeof structured?.mainText === 'string'
          ? (structured.mainText as string)
          : undefined,
    secondaryText:
      typeof record.secondaryText === 'string'
        ? record.secondaryText
        : typeof structured?.secondaryText === 'string'
          ? (structured.secondaryText as string)
          : undefined,
  }
}

function normalizeGeocodeResult(raw: unknown): GeocodeResult | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const record = raw as Record<string, unknown>
  const location = (record.location ?? record.geometry) as
    | Record<string, unknown>
    | undefined

  const latitude =
    toFiniteNumber(record.latitude ?? record.lat) ??
    toFiniteNumber(location?.latitude ?? location?.lat)
  const longitude =
    toFiniteNumber(record.longitude ?? record.lng) ??
    toFiniteNumber(location?.longitude ?? location?.lng)

  if (latitude === null || longitude === null) {
    return null
  }

  const formattedAddress =
    typeof record.formattedAddress === 'string'
      ? record.formattedAddress
      : typeof record.formatted_address === 'string'
        ? (record.formatted_address as string)
        : ''

  const components = record.addressComponents as
    | Record<string, unknown>
    | undefined

  return {
    formattedAddress,
    latitude,
    longitude,
    addressComponents: components
      ? {
          line1: typeof components.line1 === 'string' ? components.line1 : undefined,
          city: typeof components.city === 'string' ? components.city : undefined,
          area: typeof components.area === 'string' ? components.area : undefined,
          pincode:
            typeof components.pincode === 'string' ? components.pincode : undefined,
          landmark:
            typeof components.landmark === 'string' ? components.landmark : undefined,
        }
      : undefined,
  }
}

export async function getAddressPredictions(
  input: string,
): Promise<AddressPrediction[]> {
  if (!input.trim()) {
    return []
  }

  const { data } = await httpClient.get<AutocompleteResponse | AddressPrediction[]>(
    '/location/autocomplete',
    { params: { input } },
  )

  const rawPredictions = Array.isArray(data)
    ? data
    : (data.predictions ??
      (data as unknown as { items?: unknown[] }).items ??
      [])

  return rawPredictions
    .map(normalizePrediction)
    .filter((prediction): prediction is AddressPrediction => prediction !== null)
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address.trim()) {
    return null
  }

  const { data } = await httpClient.get<GeocodeResponse | GeocodeResult>(
    '/location/geocode',
    { params: { address } },
  )

  const rawResult = 'result' in data ? data.result : data

  return normalizeGeocodeResult(rawResult)
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<GeocodeResult | null> {
  const { data } = await httpClient.get<ReverseGeocodeResponse | GeocodeResult>(
    '/location/reverse-geocode',
    { params: { lat: latitude, lng: longitude } },
  )

  const rawResult = 'result' in data ? data.result : data

  return normalizeGeocodeResult(rawResult)
}
