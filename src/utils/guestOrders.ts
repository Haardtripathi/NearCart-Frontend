const guestOrdersStorageKey = 'nearcart-guest-orders'

export function getGuestOrderIds() {
  const rawValue = localStorage.getItem(guestOrdersStorageKey)

  if (!rawValue) {
    return [] as string[]
  }

  try {
    const parsedValue = JSON.parse(rawValue)

    if (!Array.isArray(parsedValue)) {
      return [] as string[]
    }

    return parsedValue.filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    )
  } catch {
    return [] as string[]
  }
}

export function addGuestOrderId(orderId: string) {
  const nextOrderIds = [orderId, ...getGuestOrderIds().filter((id) => id !== orderId)]

  localStorage.setItem(
    guestOrdersStorageKey,
    JSON.stringify(nextOrderIds.slice(0, 20)),
  )
}
