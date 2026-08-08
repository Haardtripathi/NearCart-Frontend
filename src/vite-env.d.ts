/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Google Maps JS API's documented global auth-failure hook — invoked for any key-auth-related
// failure (ApiTargetBlockedMapError, RefererNotAllowedMapError, InvalidKeyMapError, etc), which
// fires *after* the script has already loaded successfully so `@react-google-maps/api`'s own
// `loadError` never sees it. See `components/location/AddressMapPicker.tsx` for why this needs
// wiring up at all.
interface Window {
  gm_authFailure?: () => void
}
