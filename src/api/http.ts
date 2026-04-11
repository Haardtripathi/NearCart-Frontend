import axios from 'axios'

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
