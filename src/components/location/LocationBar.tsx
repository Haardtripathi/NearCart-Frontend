import { useState } from 'react'

import { LocationPickerModal } from '@/components/location/LocationPickerModal'
import { useCustomerCity } from '@/hooks/useCustomerCity'
import { useAddressStore } from '@/store/addressStore'

function PinIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path
        d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Persistent "deliver to" location bar (Swiggy/Zomato pattern) — shows the customer's selected
 * address (or a passively auto-detected city from `useCustomerCity`, matching existing behavior)
 * and opens `LocationPickerModal` to change it. Lives in `MainLayout`'s header so it's visible on
 * every public page. Selecting an address writes to `store/addressStore.ts`, which
 * `useCustomerCity` now reads first — so shop listing/search/trending everywhere already respect
 * the choice without any of those pages needing to change.
 */
export function LocationBar({ compact = false }: { compact?: boolean }) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const selectedAddress = useAddressStore((state) => state.selectedAddress)
  const { city: detectedCity, isDetecting } = useCustomerCity()

  const primaryLabel = selectedAddress?.label ?? (detectedCity ? detectedCity : 'Set delivery location')
  const secondaryLine =
    selectedAddress?.line ?? (detectedCity ? 'Auto-detected — tap to change' : isDetecting ? 'Detecting your location…' : 'Search or use current location')

  return (
    <>
      <button
        aria-haspopup="dialog"
        className={[
          'group flex items-center gap-2 rounded-2xl border border-transparent px-3 py-2 text-left transition-all hover:border-nearkart-200 hover:bg-nearkart-50',
          compact ? 'max-w-[220px]' : 'max-w-[280px]',
        ].join(' ')}
        onClick={() => setIsPickerOpen(true)}
        type="button"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-nearkart-50 text-nearkart-600 group-hover:bg-white">
          <PinIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1">
            <span className="truncate text-sm font-bold text-ink-900">{primaryLabel}</span>
            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-ink-400 transition group-hover:text-nearkart-600" />
          </span>
          <span className="block truncate text-xs text-ink-400">{secondaryLine}</span>
        </span>
      </button>

      <LocationPickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} />
    </>
  )
}
