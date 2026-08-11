import { useEffect, useRef, useState } from 'react'

import { getCustomerAddresses } from '@/api/customer'
import { reverseGeocode } from '@/api/location'
import { useAddressStore } from '@/store/addressStore'
import { useAuthStore } from '@/store/authStore'

const STORAGE_KEY = 'nearkart_customer_city'

function readCachedCity(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(STORAGE_KEY)
}

function cacheCity(city: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, city)
}

/**
 * Detects the customer's city for the `city` filter param on shop-browsing calls (list/search/
 * trending) — anonymous and fully client-side, matching Swiggy/Zomato UX (no login required).
 *
 * Priority order:
 *   0. The address explicitly selected in the header's location bar (`store/addressStore.ts`) —
 *      a manual choice always wins over auto-detection, same as Swiggy/Zomato's location picker.
 *   1. A logged-in customer's saved default address (`Address.city`) — skips the reverse-geocode
 *      call entirely for the common case of a returning customer at home.
 *   2. A one-shot browser geolocation + the backend's existing
 *      `GET /api/location/reverse-geocode` — anonymous customers / no saved address.
 *   3. `localStorage` cache of whichever of the above resolved last, so repeat visits in the same
 *      browser don't re-prompt for location every time.
 */
export function useCustomerCity() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userId = useAuthStore((state) => state.user?.id)
  const userRole = useAuthStore((state) => state.user?.role)
  const selectedAddress = useAddressStore((state) => state.selectedAddress)
  const [city, setCity] = useState<string | null>(() => selectedAddress?.city ?? readCachedCity())
  const [isDetecting, setIsDetecting] = useState(false)
  // Read inside async auto-detect callbacks so a manual header-bar pick made *while* a
  // detection request is in flight can't overwrite it once that request resolves later.
  const hasManualSelectionRef = useRef(Boolean(selectedAddress?.city))
  hasManualSelectionRef.current = Boolean(selectedAddress?.city)

  useEffect(() => {
    if (selectedAddress?.city) {
      setCity(selectedAddress.city)
      cacheCity(selectedAddress.city)
    }
  }, [selectedAddress])

  useEffect(() => {
    if (selectedAddress?.city) {
      // A manual header-bar selection always wins — skip auto-detection entirely.
      return
    }

    let isCancelled = false

    async function detectFromSavedAddress(): Promise<boolean> {
      if (!isAuthenticated || userRole !== 'CUSTOMER') {
        return false
      }

      try {
        const response = await getCustomerAddresses()
        const defaultAddress =
          response.items.find((address) => address.isDefault) ?? null

        if (defaultAddress?.city && !isCancelled && !hasManualSelectionRef.current) {
          setCity(defaultAddress.city)
          cacheCity(defaultAddress.city)
          return true
        }
      } catch {
        // Fall through to device geolocation below.
      }

      return false
    }

    function detectFromDeviceLocation() {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return
      }

      setIsDetecting(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          reverseGeocode(position.coords.latitude, position.coords.longitude)
            .then((result) => {
              const detectedCity = result?.components.city

              if (detectedCity && !isCancelled && !hasManualSelectionRef.current) {
                setCity(detectedCity)
                cacheCity(detectedCity)
              }
            })
            .catch(() => {
              // No-op — city stays whatever it already was (possibly null); shop-browsing
              // calls simply omit the `city` filter in that case.
            })
            .finally(() => {
              if (!isCancelled) {
                setIsDetecting(false)
              }
            })
        },
        () => {
          if (!isCancelled) {
            setIsDetecting(false)
          }
        },
        { maximumAge: 10 * 60 * 1000, timeout: 8000 },
      )
    }

    void detectFromSavedAddress().then((resolved) => {
      if (!resolved && !isCancelled && !readCachedCity()) {
        detectFromDeviceLocation()
      }
    })

    return () => {
      isCancelled = true
      // `detectFromDeviceLocation` only clears `isDetecting` inside its geolocation
      // callbacks, each guarded by `!isCancelled`. If this effect is cancelled (e.g. auth
      // state changes because the user logs in) while a geolocation/reverse-geocode call is
      // still in flight, that guard skips the reset and `isDetecting` would stay stuck at
      // `true` forever since nothing else clears it. Resetting here on every cleanup
      // guarantees it never gets left on past this effect's own lifetime.
      setIsDetecting(false)
    }
  }, [isAuthenticated, userId, userRole])

  return { city: city ?? undefined, isDetecting }
}
