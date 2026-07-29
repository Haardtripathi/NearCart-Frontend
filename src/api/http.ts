import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5002/api'

export const httpClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 8000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function setHttpAccessToken(accessToken: string | null) {
  if (accessToken) {
    httpClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    return
  }

  delete httpClient.defaults.headers.common.Authorization
}

// Wired up by `store/authStore.ts` after it initializes (kept here, rather than importing the
// store directly, to avoid a circular import — the store already imports `setHttpAccessToken`
// from this file). Without this, a request that 401s because the short-lived access token
// expired mid-session had no way to recover: the user would see a raw error on every subsequent
// action until they hard-refreshed the page (which re-runs `AuthBootstrap` -> `restoreSession`).
interface UnauthorizedHandlers {
  /** Returns the refreshed access token, or `null` if the refresh itself failed. */
  refresh: () => Promise<string | null>
  onRefreshFailed: () => void
  /** Only attempt the refresh-and-retry dance once the app's one-time initial session restore
   * (`AuthBootstrap` -> `restoreSession`) has already completed, so this doesn't race with or
   * duplicate that bootstrap flow's own retry logic. */
  hasRestoredSession: () => boolean
}

let unauthorizedHandlers: UnauthorizedHandlers | null = null

export function registerUnauthorizedHandlers(handlers: UnauthorizedHandlers) {
  unauthorizedHandlers = handlers
}

let refreshInFlight: Promise<string | null> | null = null

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined
    const status = error?.response?.status
    const requestUrl = originalRequest?.url ?? ''
    const isAuthLifecycleEndpoint =
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/logout')

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthLifecycleEndpoint &&
      unauthorizedHandlers?.hasRestoredSession()
    ) {
      originalRequest._retry = true

      if (!refreshInFlight) {
        refreshInFlight = unauthorizedHandlers.refresh().finally(() => {
          refreshInFlight = null
        })
      }

      const refreshedToken = await refreshInFlight

      if (refreshedToken) {
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${refreshedToken}`

        return httpClient(originalRequest)
      }

      unauthorizedHandlers.onRefreshFailed()
    }

    return Promise.reject(error)
  },
)
