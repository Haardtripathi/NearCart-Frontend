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

/**
 * Pulls `details.retryAfterSeconds` off an OTP resend-cooldown 429 response
 * (see `NearCart/backend/src/services/otp.service.ts`'s
 * `requestEmailVerificationOtp`), so the UI can start an accurate countdown
 * instead of just showing the error message.
 */
export function getApiErrorRetryAfterSeconds(error: unknown): number | null {
  if (!axios.isAxiosError(error)) {
    return null
  }

  const retryAfterSeconds = error.response?.data?.details?.retryAfterSeconds

  return typeof retryAfterSeconds === 'number' ? retryAfterSeconds : null
}
