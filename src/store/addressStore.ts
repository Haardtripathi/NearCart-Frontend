import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * The customer's currently selected "deliver to" address — drives the persistent location bar in
 * `MainLayout` (Swiggy/Zomato-style). Deliberately separate from `store/authStore.ts` /
 * `types/customer.ts`'s `Address` model: this also needs to represent a one-off device-geolocation
 * pick that was never saved to the backend, and needs to work for guests (no account yet), so it
 * keeps its own small, persisted shape instead of depending on a saved `Address` record existing.
 */
export interface SelectedAddress {
  /** `saved` = one of the customer's `Address` records; `current` = live device geolocation;
   *  `searched` = picked from the address search/autocomplete without being saved. */
  source: 'saved' | 'current' | 'searched'
  /** Present only when `source === 'saved'` — the backend `Address.id`. */
  addressId?: string
  /** Short label shown in the collapsed header pill, e.g. "Home" or "Current location". */
  label: string
  /** Full single-line address text shown in the picker / as a subtitle. */
  line: string
  city: string | null
  latitude: number | null
  longitude: number | null
}

interface AddressStore {
  selectedAddress: SelectedAddress | null
  setSelectedAddress: (address: SelectedAddress) => void
  clearSelectedAddress: () => void
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set) => ({
      selectedAddress: null,
      setSelectedAddress: (address) => set({ selectedAddress: address }),
      clearSelectedAddress: () => set({ selectedAddress: null }),
    }),
    {
      name: 'nearkart-selected-address',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
