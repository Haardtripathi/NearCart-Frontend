import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  addressComponents?: GeocodeResult['addressComponents']
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

  const [searchInput, setSearchInput] = useState('')
  const [predictions, setPredictions] = useState<AddressPrediction[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    }
  }, [])

  function applyGeocodeResult(result: GeocodeResult) {
    onLocationChange({
      latitude: result.latitude,
      longitude: result.longitude,
      formattedAddress: result.formattedAddress,
      addressComponents: result.addressComponents,
    })
  }

  function handleSearchInputChange(value: string) {
    setSearchInput(value)
    setErrorMessage(null)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!value.trim() || value.trim().length < 3) {
      setPredictions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)

      try {
        const results = await getAddressPredictions(value)
        setPredictions(results)
      } catch (error) {
        setPredictions([])
        setErrorMessage(
          getApiErrorMessage(error, 'Unable to search for addresses right now.'),
        )
      } finally {
        setIsSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)
  }

  async function handleSelectPrediction(prediction: AddressPrediction) {
    setPredictions([])
    setSearchInput(prediction.description)
    setStatusMessage(null)
    setErrorMessage(null)

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
        try {
          const result = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude,
          )

          if (result) {
            applyGeocodeResult(result)
            setSearchInput(result.formattedAddress)
          } else {
            onLocationChange({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          }

          setStatusMessage('Using your current location. Drag the pin to confirm the exact spot.')
        } catch (error) {
          onLocationChange({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
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

      try {
        const result = await reverseGeocode(nextLatitude, nextLongitude)

        if (result) {
          applyGeocodeResult(result)
          setSearchInput(result.formattedAddress)
        } else {
          onLocationChange({ latitude: nextLatitude, longitude: nextLongitude })
        }

        setStatusMessage('Pin updated. This exact spot will be saved with your address.')
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
    <div className="space-y-3 rounded-[1.35rem] border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">
          Confirm the exact location
        </span>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-nearkart-200 bg-white px-3 py-1.5 text-xs font-semibold text-nearkart-700 transition hover:bg-nearkart-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLocating}
          onClick={handleUseCurrentLocation}
          type="button"
        >
          {isLocating ? 'Locating…' : 'Use my current location'}
        </button>
      </div>

      <div className="relative">
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-nearkart-400"
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

      {apiKey && !mapScriptError ? (
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
          {mapScriptError
            ? 'The map failed to load. You can still search or use your current location — coordinates will be saved without the visual pin.'
            : 'Map preview is unavailable (no VITE_GOOGLE_MAPS_API_KEY configured). Search or use your current location to set coordinates without the pin map.'}
        </div>
      )}

      {hasPin ? (
        <p className="text-xs text-slate-500">
          Pin location: {(latitude as number).toFixed(6)}, {(longitude as number).toFixed(6)}
          {apiKey && isMapScriptLoaded ? ' — drag the pin above to nudge it.' : ''}
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
