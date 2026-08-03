import { useEffect, useState } from 'react'

export interface GeolocationCoordinates {
  latitude: number
  longitude: number
}

interface UseGeolocationResult {
  coordinates: GeolocationCoordinates | null
  /** True only while the browser's permission prompt / a lookup is in flight. */
  isLocating: boolean
  /**
   * True once geolocation has been declined, is unavailable, or failed — callers use this to
   * stop waiting on `coordinates` and just render the unfiltered/no-distance view instead of
   * blocking on it forever.
   */
  isUnavailable: boolean
}

/**
 * One-shot browser geolocation lookup, used to pass `lat`/`lng` into the hyperlocal shop-list
 * request (`GET /public/shops`) so results can be distance-filtered/sorted server-side.
 *
 * Deliberately fail-open: an unsupported browser, a declined permission prompt, or a timeout
 * all resolve to `coordinates: null` rather than throwing — callers must keep working (showing
 * the unfiltered shop list) exactly like before this hook existed, never block or error the
 * page on a missing/declined location.
 */
export function useGeolocation(): UseGeolocationResult {
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isUnavailable, setIsUnavailable] = useState(false)

  useEffect(() => {
    let isCancelled = false

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setIsUnavailable(true)
      return
    }

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isCancelled) {
          return
        }

        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setIsLocating(false)
      },
      () => {
        // Permission denied, position unavailable, or timed out — all treated the same: no
        // coordinates, page falls back to the unfiltered shop list.
        if (isCancelled) {
          return
        }

        setIsUnavailable(true)
        setIsLocating(false)
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 8000 },
    )

    return () => {
      isCancelled = true
    }
  }, [])

  return { coordinates, isLocating, isUnavailable }
}
