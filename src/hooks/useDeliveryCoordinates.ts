import { useMemo } from 'react'

import { useGeolocation, type GeolocationCoordinates } from '@/hooks/useGeolocation'
import { useAddressStore } from '@/store/addressStore'

interface UseDeliveryCoordinatesResult {
  coordinates: GeolocationCoordinates | null
}

/**
 * Coordinates used for hyperlocal shop distance filtering/sorting (`GET /public/shops`'s
 * `lat`/`lng` params) — mirrors `useCustomerCity`'s priority order but for lat/lng instead of the
 * city string: a location the customer explicitly picked in the header's `LocationBar` /
 * `LocationPickerModal` (saved address, search result, or a fresh "current location" fix) always
 * wins over a raw, independent `useGeolocation()` reading.
 *
 * Bug found during the redesign regression sweep: `ShopsPage`/`HomePage` called `useGeolocation()`
 * directly for the distance filter while `useCustomerCity()` (via `store/addressStore.ts`) drove
 * the `city` text filter — the two were wired to different sources. Picking a saved/searched
 * address in a different area updated the `city` param correctly but left the distance filter
 * comparing shops against the browser's actual GPS fix, which (for anyone whose device is
 * physically elsewhere, e.g. picking a "Work" address in another city while still at home) silently
 * filtered out every shop in the newly-selected area — city matched, distance didn't, shops vanish.
 */
export function useDeliveryCoordinates(): UseDeliveryCoordinatesResult {
  const selectedLatitude = useAddressStore((state) => state.selectedAddress?.latitude ?? null)
  const selectedLongitude = useAddressStore((state) => state.selectedAddress?.longitude ?? null)
  const { coordinates: deviceCoordinates } = useGeolocation()

  // Memoized on the primitive lat/lng values (not object identity) — callers commonly put
  // `coordinates` straight into a data-fetching effect's dependency array (see ShopsPage,
  // HomePage). A fresh `{ latitude, longitude }` literal returned on every render would compare
  // unequal to itself across renders and re-trigger that effect forever: exactly this bug shipped
  // once already (caught live via Playwright during the redesign sweep — `GET /public/shops`
  // fired continuously until the backend's rate limiter started returning 429s) before this
  // `useMemo` was added.
  return useMemo(() => {
    if (selectedLatitude != null && selectedLongitude != null) {
      return { coordinates: { latitude: selectedLatitude, longitude: selectedLongitude } }
    }

    return { coordinates: deviceCoordinates }
  }, [selectedLatitude, selectedLongitude, deviceCoordinates])
}
