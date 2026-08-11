import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'

import {
  geocodeAddress,
  getAddressPredictions,
  reverseGeocode,
} from '@/api/location'
import type { AddressPrediction, GeocodeResult } from '@/types/location'
import { getApiErrorMessage } from '@/utils/api'

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 } // India, used until a location is picked
const DEFAULT_ZOOM = 5
const PICKED_ZOOM = 16
const SEARCH_DEBOUNCE_MS = 350
const mapContainerStyle = { width: '100%', height: '280px', borderRadius: '1.35rem' }

export interface PickedLocation {
  latitude: number
  longitude: number
  formattedAddress?: string
  addressComponents?: GeocodeResult['components']
}

interface AddressMapPickerProps {
  latitude: number | null
  longitude: number | null
  onLocationChange: (location: PickedLocation) => void
}

export function AddressMapPicker({
  latitude,
  longitude,
  onLocationChange,
}: AddressMapPickerProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const { isLoaded: isMapScriptLoaded, loadError: mapScriptError } = useJsApiLoader({
    id: 'nearkart-google-maps',
    googleMapsApiKey: apiKey || '',
  })

  // `useJsApiLoader`'s `loadError` only fires when the Maps JS *script itself* fails to fetch —
  // it does NOT fire for key-level auth failures (ApiTargetBlockedMapError,
  // RefererNotAllowedMapError, InvalidKeyMapError, etc). Those happen *after* the script has
  // already loaded successfully, when the Maps runtime tries to actually stand up a map
  // instance — Google's own JS then renders its own "Oops! Something went wrong" placeholder
  // directly inside the map container, bypassing React entirely. Confirmed live via Playwright:
  // with a key that's restricted away from the Maps JavaScript API, `isMapScriptLoaded` was
  // true and `mapScriptError` stayed null, so the code below rendered `<GoogleMap>`, which then
  // silently mounted Google's raw error box inside the checkout flow. The one hook Google
  // provides for this is the documented global `window.gm_authFailure` callback, invoked for any
  // key-auth-related failure — wiring it lets the friendly fallback (below) cover this case too,
  // and manual address entry keeps working either way since it never depended on the map.
  const [hasMapAuthFailure, setHasMapAuthFailure] = useState(false)

  useEffect(() => {
    window.gm_authFailure = () => setHasMapAuthFailure(true)

    return () => {
      delete window.gm_authFailure
    }
  }, [])

  const [searchInput, setSearchInput] = useState('')
  const [predictions, setPredictions] = useState<AddressPrediction[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchAbortControllerRef = useRef<AbortController | null>(null)
  // Groups a "typing session" of autocomplete calls for Google's session-based billing; reset
  // once the session ends (a prediction is picked or the search is cleared).
  const sessionTokenRef = useRef<string | null>(null)

  const hasPin = latitude !== null && longitude !== null
  const center = useMemo(
    () => (hasPin ? { lat: latitude as number, lng: longitude as number } : DEFAULT_CENTER),
    [hasPin, latitude, longitude],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      searchAbortControllerRef.current?.abort()
    }
  }, [])

  function applyGeocodeResult(result: GeocodeResult) {
    onLocationChange({
      latitude: result.latitude,
      longitude: result.longitude,
      formattedAddress: result.formattedAddress,
      addressComponents: result.components,
    })
  }

  function getSessionToken() {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }

    return sessionTokenRef.current
  }

  function handleSearchInputChange(value: string) {
    setSearchInput(value)
    setErrorMessage(null)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!value.trim() || value.trim().length < 3) {
      // Abort any in-flight search so a slow, now-irrelevant response can't repopulate the
      // dropdown after the user has cleared the input.
      searchAbortControllerRef.current?.abort()
      setPredictions([])
      setIsSearching(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      // Cancel the previous request before starting a new one — without this, a slow early
      // response can resolve after a faster later one and overwrite it with stale predictions.
      searchAbortControllerRef.current?.abort()
      const controller = new AbortController()
      searchAbortControllerRef.current = controller

      setIsSearching(true)

      try {
        const results = await getAddressPredictions(value, {
          signal: controller.signal,
          sessionToken: getSessionToken(),
        })

        if (controller.signal.aborted) {
          return
        }

        setPredictions(results)
      } catch (error) {
        if (axios.isCancel(error) || controller.signal.aborted) {
          return
        }

        setPredictions([])
        setErrorMessage(
          getApiErrorMessage(error, 'Unable to search for addresses right now.'),
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false)
        }
      }
    }, SEARCH_DEBOUNCE_MS)
  }

  async function handleSelectPrediction(prediction: AddressPrediction) {
    setPredictions([])
    setSearchInput(prediction.description)
    setStatusMessage(null)
    setErrorMessage(null)
    // The autocomplete session (and its session token) ends once a prediction is resolved.
    searchAbortControllerRef.current?.abort()
    sessionTokenRef.current = null

    try {
      const result = await geocodeAddress(prediction.description)

      if (!result) {
        setErrorMessage('Could not resolve coordinates for that address. Try dragging the pin instead.')
        return
      }

      applyGeocodeResult(result)
      setStatusMessage('Location set from search. Drag the pin to fine-tune it if needed.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Unable to look up that address right now.'))
    }
  }

  function handleUseCurrentLocation() {
    setErrorMessage(null)
    setStatusMessage(null)

    if (!('geolocation' in navigator)) {
      setErrorMessage('Geolocation is not supported by this browser.')
      return
    }

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // The device's own GPS reading is the source of truth for "current location" — reverse
        // geocoding is only used to fill in the address text. Using the geocode result's
        // (possibly snapped-to-nearest-known-address) coordinates instead would silently move
        // the saved pin away from where the device actually is.
        const { latitude: deviceLatitude, longitude: deviceLongitude } = position.coords

        try {
          const result = await reverseGeocode(deviceLatitude, deviceLongitude)

          onLocationChange({
            latitude: deviceLatitude,
            longitude: deviceLongitude,
            formattedAddress: result?.formattedAddress,
            addressComponents: result?.components,
          })

          if (result) {
            setSearchInput(result.formattedAddress)
            setStatusMessage('Using your current location. Drag the pin to confirm the exact spot.')
          } else {
            setStatusMessage(
              'Using your current location, but we could not resolve an address for it. Drag the pin to confirm.',
            )
          }
        } catch (error) {
          onLocationChange({ latitude: deviceLatitude, longitude: deviceLongitude })
          setErrorMessage(
            getApiErrorMessage(
              error,
              'Found your coordinates, but could not turn them into an address yet. Drag the pin to confirm.',
            ),
          )
        } finally {
          setIsLocating(false)
        }
      },
      (geoError) => {
        setIsLocating(false)
        setErrorMessage(
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Location permission was denied. Search or drag the pin instead.'
            : 'Unable to detect your current location. Search or drag the pin instead.',
        )
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const handleMarkerDragEnd = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      const nextLatitude = event.latLng?.lat()
      const nextLongitude = event.latLng?.lng()

      if (nextLatitude === undefined || nextLongitude === undefined) {
        return
      }

      setErrorMessage(null)

      // Same principle as "use my current location": the dragged/clicked point is the source of
      // truth for the saved pin. Reverse geocoding only supplies the address text — using its
      // (possibly snapped) coordinates instead would leave the visible pin and the saved
      // latitude/longitude out of sync.
      try {
        const result = await reverseGeocode(nextLatitude, nextLongitude)

        onLocationChange({
          latitude: nextLatitude,
          longitude: nextLongitude,
          formattedAddress: result?.formattedAddress,
          addressComponents: result?.components,
        })

        if (result) {
          setSearchInput(result.formattedAddress)
          setStatusMessage('Pin updated. This exact spot will be saved with your address.')
        } else {
          setStatusMessage(
            'Pin updated, but we could not resolve an address for it — the coordinates are still saved.',
          )
        }
      } catch {
        onLocationChange({ latitude: nextLatitude, longitude: nextLongitude })
        setStatusMessage(
          'Pin updated, but we could not refresh the address text — the coordinates are still saved.',
        )
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  function handleMapClick(event: google.maps.MapMouseEvent) {
    void handleMarkerDragEnd(event)
  }

  return (
    <div className="space-y-3 rounded-[1.35rem] border border-nearkart-100 bg-nearkart-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-bold text-ink-800">
          📍 Confirm the exact location
        </span>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-nearkart-300 bg-white px-3 py-1.5 text-xs font-bold text-nearkart-700 shadow-sm transition hover:bg-nearkart-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLocating}
          onClick={handleUseCurrentLocation}
          type="button"
        >
          {isLocating ? 'Locating…' : 'Use my current location'}
        </button>
      </div>

      <div className="relative">
        <input
          className="field-input"
          onChange={(event) => handleSearchInputChange(event.target.value)}
          placeholder="Search for your address, area, or landmark"
          value={searchInput}
        />
        {isSearching ? (
          <span className="absolute right-4 top-3.5 text-xs text-slate-400">Searching…</span>
        ) : null}

        {predictions.length > 0 ? (
          <ul className="absolute z-10 mt-2 w-full space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
            {predictions.map((prediction) => (
              <li key={prediction.placeId}>
                <button
                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-nearkart-50"
                  onClick={() => void handleSelectPrediction(prediction)}
                  type="button"
                >
                  {prediction.mainText ? (
                    <>
                      <span className="font-medium text-ink-900">
                        {prediction.mainText}
                      </span>
                      {prediction.secondaryText ? (
                        <span className="block text-xs text-slate-500">
                          {prediction.secondaryText}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    prediction.description
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {apiKey && !mapScriptError && !hasMapAuthFailure ? (
        isMapScriptLoaded ? (
          <div className="overflow-hidden rounded-[1.35rem]">
            <GoogleMap
              center={center}
              mapContainerStyle={mapContainerStyle}
              onClick={handleMapClick}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
              zoom={hasPin ? PICKED_ZOOM : DEFAULT_ZOOM}
            >
              {hasPin ? (
                <Marker
                  draggable
                  onDragEnd={handleMarkerDragEnd}
                  position={{ lat: latitude as number, lng: longitude as number }}
                />
              ) : null}
            </GoogleMap>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-[1.35rem] border border-dashed border-slate-300 bg-white text-sm text-slate-500">
            Loading map…
          </div>
        )
      ) : (
        <div className="rounded-[1.35rem] border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
          {hasMapAuthFailure
            ? 'Map preview is temporarily unavailable. You can still search or use your current location — coordinates will be saved without the visual pin.'
            : mapScriptError
              ? 'The map failed to load. You can still search or use your current location — coordinates will be saved without the visual pin.'
              : 'Map preview is unavailable (no VITE_GOOGLE_MAPS_API_KEY configured). Search or use your current location to set coordinates without the pin map.'}
        </div>
      )}

      {hasPin ? (
        <p className="text-xs text-slate-500">
          Pin location: {(latitude as number).toFixed(6)}, {(longitude as number).toFixed(6)}
          {apiKey && isMapScriptLoaded && !hasMapAuthFailure ? ' — drag the pin above to nudge it.' : ''}
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          No location set yet. Search above or use your current location to drop a pin.
        </p>
      )}

      {statusMessage ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {statusMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</p>
      ) : null}
    </div>
  )
}
