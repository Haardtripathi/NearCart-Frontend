import axios from 'axios'

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5002/api'

export const httpClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
})
