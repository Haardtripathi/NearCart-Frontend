/**
 * Label for the rain/weather delivery surcharge line item — used on the
 * checkout summary, order confirmation, and order detail views. Never shows
 * the raw `'unknown'` condition string to the customer; falls back to a
 * neutral label instead.
 */
export function formatWeatherSurchargeLabel(weatherCondition: string): string {
  if (!weatherCondition || weatherCondition.toLowerCase() === 'unknown') {
    return 'Weather surcharge'
  }

  return `Weather surcharge (${weatherCondition})`
}
