import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

import { getCustomerAddresses } from '@/api/customer'
import { geocodeAddress, getAddressPredictions, reverseGeocode } from '@/api/location'
import { useAddressStore, type SelectedAddress } from '@/store/addressStore'
import { useAuthStore } from '@/store/authStore'
import type { Address } from '@/types/customer'
import type { AddressPrediction } from '@/types/location'
import { getApiErrorMessage } from '@/utils/api'

const SEARCH_DEBOUNCE_MS = 350

interface LocationPickerModalProps {
  isOpen: boolean
  onClose: () => void
}

function addressToSelection(address: Address): SelectedAddress {
  return {
    source: 'saved',
    addressId: address.id,
    label: address.label || 'Saved address',
    line: [address.line1, address.area || address.city].filter(Boolean).join(', '),
    city: address.city ?? null,
    latitude: address.latitude,
    longitude: address.longitude,
  }
}

export function LocationPickerModal({ isOpen, onClose }: LocationPickerModalProps) {
  const setSelectedAddress = useAddressStore((state) => state.setSelectedAddress)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userRole = useAuthStore((state) => state.user?.role)

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [predictions, setPredictions] = useState<AddressPrediction[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  const canShowSavedAddresses = isAuthenticated && userRole === 'CUSTOMER'

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setErrorMessage(null)
    setSearchInput('')
    setPredictions([])

    if (!canShowSavedAddresses) {
      return
    }

    let isMounted = true
    setIsLoadingAddresses(true)

    getCustomerAddresses()
      .then((response) => {
        if (isMounted) {
          setSavedAddresses(response.items)
        }
      })
      .catch(() => {
        if (isMounted) {
          setSavedAddresses([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingAddresses(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, canShowSavedAddresses])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      searchAbortRef.current?.abort()
    }
  }, [])

  if (!isOpen) {
    return null
  }

  function applySelection(selection: SelectedAddress) {
    setSelectedAddress(selection)
    onClose()
  }

  function handleUseCurrentLocation() {
    setErrorMessage(null)

    if (!('geolocation' in navigator)) {
      setErrorMessage('Geolocation is not supported by this browser.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          const result = await reverseGeocode(latitude, longitude)
          applySelection({
            source: 'current',
            label: 'Current location',
            line: result?.formattedAddress ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            city: result?.components.city ?? null,
            latitude,
            longitude,
          })
        } catch {
          applySelection({
            source: 'current',
            label: 'Current location',
            line: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            city: null,
            latitude,
            longitude,
          })
        } finally {
          setIsLocating(false)
        }
      },
      (geoError) => {
        setIsLocating(false)
        setErrorMessage(
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Location permission was denied. Search for your address instead.'
            : 'Unable to detect your current location. Search for your address instead.',
        )
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  function handleSearchInputChange(value: string) {
    setSearchInput(value)
    setErrorMessage(null)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!value.trim() || value.trim().length < 3) {
      searchAbortRef.current?.abort()
      setPredictions([])
      setIsSearching(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      searchAbortRef.current?.abort()
      const controller = new AbortController()
      searchAbortRef.current = controller
      setIsSearching(true)

      try {
        const results = await getAddressPredictions(value, { signal: controller.signal })

        if (!controller.signal.aborted) {
          setPredictions(results)
        }
      } catch (error) {
        if (!axios.isCancel(error) && !controller.signal.aborted) {
          setErrorMessage(getApiErrorMessage(error, 'Unable to search for addresses right now.'))
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false)
        }
      }
    }, SEARCH_DEBOUNCE_MS)
  }

  async function handleSelectPrediction(prediction: AddressPrediction) {
    setErrorMessage(null)

    try {
      const result = await geocodeAddress(prediction.description)

      if (!result) {
        setErrorMessage('Could not resolve that address. Try another search or use your current location.')
        return
      }

      applySelection({
        source: 'searched',
        label: prediction.mainText || prediction.description,
        line: result.formattedAddress,
        city: result.components.city,
        latitude: result.latitude,
        longitude: result.longitude,
      })
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Unable to look up that address right now.'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink-900/40 px-4 pt-16 backdrop-blur-sm sm:pt-24">
      <div
        aria-modal="true"
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-ink-100 bg-white shadow-glass-strong"
        role="dialog"
      >
        <div className="sticky top-0 z-10 space-y-4 border-b border-ink-100 bg-white/95 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-900">Change delivery location</h2>
            <button
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-ink-900"
              onClick={onClose}
              type="button"
            >
              ✕
            </button>
          </div>

          <input
            autoFocus
            className="field-input"
            onChange={(event) => handleSearchInputChange(event.target.value)}
            placeholder="Search for area, street name, landmark..."
            value={searchInput}
          />

          <button
            className="btn-secondary h-11 w-full justify-start px-4"
            disabled={isLocating}
            onClick={handleUseCurrentLocation}
            type="button"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-nearkart-100 text-nearkart-700">
              📍
            </span>
            {isLocating ? 'Locating…' : 'Use my current location'}
          </button>
        </div>

        <div className="space-y-5 p-5">
          {errorMessage ? (
            <p className="rounded-xl bg-accent-50 px-3 py-2 text-xs text-accent-700">{errorMessage}</p>
          ) : null}

          {isSearching ? <p className="text-xs text-ink-400">Searching…</p> : null}

          {/* Bug found during the redesign regression sweep: a search that legitimately returns
              zero results (typo, an address outside Google's coverage, pure gibberish) rendered
              nothing at all here — no "Searching…", no results list, no feedback — so the modal
              looked exactly like it did before anything was typed, and a customer had no way to
              tell "no matches" apart from "did my search even happen?". */}
          {!isSearching && !errorMessage && searchInput.trim().length >= 3 && predictions.length === 0 ? (
            <p className="rounded-xl bg-ink-50 px-3 py-3 text-xs text-ink-500">
              No matches for &ldquo;{searchInput.trim()}&rdquo;. Try a different area, street, or
              landmark — or use your current location instead.
            </p>
          ) : null}

          {predictions.length > 0 ? (
            <div className="space-y-1">
              <p className="px-1 text-xs font-bold uppercase tracking-[0.18em] text-ink-400">Search results</p>
              <ul className="space-y-1">
                {predictions.map((prediction) => (
                  <li key={prediction.placeId}>
                    <button
                      className="w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-nearkart-50"
                      onClick={() => void handleSelectPrediction(prediction)}
                      type="button"
                    >
                      <span className="block text-sm font-semibold text-ink-900">
                        {prediction.mainText || prediction.description}
                      </span>
                      {prediction.secondaryText ? (
                        <span className="block text-xs text-ink-400">{prediction.secondaryText}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {canShowSavedAddresses ? (
            <div className="space-y-2">
              <p className="px-1 text-xs font-bold uppercase tracking-[0.18em] text-ink-400">Saved addresses</p>
              {isLoadingAddresses ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }, (_, index) => (
                    <div key={`addr-skeleton-${index}`} className="h-16 animate-pulse rounded-xl bg-ink-50" />
                  ))}
                </div>
              ) : savedAddresses.length > 0 ? (
                <ul className="space-y-1">
                  {savedAddresses.map((address) => (
                    <li key={address.id}>
                      <button
                        className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-nearkart-50"
                        onClick={() => applySelection(addressToSelection(address))}
                        type="button"
                      >
                        <span className="mt-0.5 text-lg">{address.label.toLowerCase().includes('work') ? '💼' : '🏠'}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-ink-900">{address.label}</span>
                          <span className="block truncate text-xs text-ink-400">
                            {[address.line1, address.area, address.city].filter(Boolean).join(', ')}
                          </span>
                        </span>
                        {address.isDefault ? (
                          <span className="rounded-full bg-nearkart-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-nearkart-700">
                            Default
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl bg-ink-50 px-3 py-3 text-xs text-ink-500">
                  No saved addresses yet.
                </p>
              )}
              <Link
                className="inline-block px-1 pt-1 text-xs font-bold text-nearkart-600 hover:underline"
                onClick={onClose}
                to="/dashboard/customer/addresses"
              >
                Manage saved addresses →
              </Link>
            </div>
          ) : (
            <p className="rounded-xl bg-ink-50 px-3 py-3 text-xs text-ink-500">
              <Link className="font-bold text-nearkart-600 hover:underline" onClick={onClose} to="/login">
                Sign in
              </Link>{' '}
              to save addresses for faster checkout next time.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
