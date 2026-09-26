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
export function useGeolocation(enabled = true): UseGeolocationResult {
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null)
  // Both of these start from what is already knowable at first render rather than being pushed in
  // by a synchronous setState inside the effect below. Whether the browser exposes geolocation at
  // all is a static fact about the environment, and the effect starts locating immediately on
  // mount whenever it is available — so seeding them here produces the same states one render
  // earlier, and avoids the extra mount-time render pass that setting them in the effect body
  // caused (flagged by react-hooks/set-state-in-effect).
  const isSupported = typeof navigator !== 'undefined' && Boolean(navigator.geolocation)
  // `isLocating` is derived (below) rather than stored, so it is already true on the very render
  // where `enabled` flips on — no synchronous setState in the effect to get there.
  const [hasSettled, setHasSettled] = useState(false)
  const [isUnavailable, setIsUnavailable] = useState(!isSupported)

  useEffect(() => {
    let isCancelled = false

    // `enabled: false` lets a caller that doesn't need the device fix yet (or already has a
    // chosen address) avoid triggering the browser's permission prompt at all.
    if (!isSupported || !enabled) {
      return
    }

    // Watchdog for a real browser/OS bug (confirmed Chromium-on-Linux geoclue stalls) where
    // `getCurrentPosition` can fail to invoke either callback within its requested `timeout`,
    // hanging indefinitely. Without this, `isLocating` (and any spinner tied to it) would never
    // resolve. Fires slightly after the native timeout so a normal native timeout always wins.
    let settled = false
    const watchdog = window.setTimeout(() => {
      if (settled || isCancelled) {
        return
      }

      settled = true
      setIsUnavailable(true)
      setHasSettled(true)
    }, 9000)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (settled || isCancelled) {
          return
        }

        settled = true
        window.clearTimeout(watchdog)

        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setHasSettled(true)
      },
      () => {
        // Permission denied, position unavailable, or timed out — all treated the same: no
        // coordinates, page falls back to the unfiltered shop list.
        if (settled || isCancelled) {
          return
        }

        settled = true
        window.clearTimeout(watchdog)
        setIsUnavailable(true)
        setHasSettled(true)
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 8000 },
    )

    return () => {
      isCancelled = true
      window.clearTimeout(watchdog)
    }
    // `isSupported` is a static fact about the environment, so this runs once per time `enabled`
    // turns on.
  }, [isSupported, enabled])

  return {
    coordinates,
    isLocating: enabled && isSupported && !hasSettled,
    isUnavailable,
  }
}
