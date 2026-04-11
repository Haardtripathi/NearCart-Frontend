import axios from 'axios'

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage
  }

  const message =
    typeof error.response?.data?.message === 'string'
      ? error.response.data.message
      : null

  if (!message) {
    return fallbackMessage
  }

  return message
}
