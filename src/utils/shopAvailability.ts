import axios from 'axios'

import type { ShopTodayStatus } from '@/types/api'

/**
 * Shared badge/messaging helpers for `todayStatus` (`PublicShopSummary`,
 * `PublicShopDetail`, `ManagedShop`) — the shop-owner's daily open/closed
 * toggle (`PATCH /shop-owner/shops/:id/today-status`) and the customer-facing
 * shop card / shop detail page / checkout page all render the same three
 * states, so keep the copy in one place instead of duplicating it per view.
 */

export function getTodayStatusLabel(todayStatus: ShopTodayStatus): string {
  switch (todayStatus) {
    case 'OPEN':
      return 'Open'
    case 'PENDING_CONFIRMATION':
      return 'Opens soon'
    case 'CLOSED':
      return 'Closed today'
    default:
      return 'Unavailable'
  }
}

export function getTodayStatusTone(
  todayStatus: ShopTodayStatus,
): 'success' | 'warning' | 'danger' {
  switch (todayStatus) {
    case 'OPEN':
      return 'success'
    case 'PENDING_CONFIRMATION':
      return 'warning'
    case 'CLOSED':
    default:
      return 'danger'
  }
}

/** Null when the shop is open — callers should simply not render a message. */
export function getTodayStatusMessage(shop: {
  todayStatus: ShopTodayStatus
  todayStatusReason: string | null
}): string | null {
  if (shop.todayStatus === 'OPEN') {
    return null
  }

  if (shop.todayStatus === 'PENDING_CONFIRMATION') {
    return "This shop hasn't confirmed today's hours yet — check back soon."
  }

  return shop.todayStatusReason
    ? `Closed today (${shop.todayStatusReason})`
    : 'Closed today.'
}

export function isShopOrderable(todayStatus: ShopTodayStatus): boolean {
  return todayStatus === 'OPEN'
}

/**
 * Detects the checkout-time "shop isn't open today" rejection — per the
 * rain-fee/shop-availability contract, `POST /orders` responds `HTTP 403
 * { message, code: 'SHOP_NOT_OPEN_TODAY', data: { todayStatus, reason } }`
 * when a shop's daily status flips to non-OPEN mid-session. Mirrors
 * `getServiceAreaErrorInfo` in `serviceArea.ts`, but keys off the explicit
 * `code` field since the backend actually sends one for this error (unlike
 * the service-area case, which has no discriminator and keys off `details`
 * shape instead).
 */
export interface ShopNotOpenTodayErrorInfo {
  message: string
  todayStatus: ShopTodayStatus | null
  reason: string | null
}

export function getShopNotOpenTodayErrorInfo(
  error: unknown,
): ShopNotOpenTodayErrorInfo | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 403) {
    return null
  }

  const data = error.response.data as
    | {
        message?: string
        code?: string
        data?: { todayStatus?: ShopTodayStatus; reason?: string | null }
      }
    | undefined

  if (data?.code !== 'SHOP_NOT_OPEN_TODAY') {
    return null
  }

  return {
    message:
      typeof data.message === 'string' && data.message
        ? data.message
        : 'This shop is not open today.',
    todayStatus: data.data?.todayStatus ?? null,
    reason: data.data?.reason ?? null,
  }
}

export function formatShopNotOpenTodayMessage(
  info: ShopNotOpenTodayErrorInfo,
): string {
  if (info.todayStatus === 'PENDING_CONFIRMATION') {
    return "This shop hasn't confirmed today's hours yet, so it can't accept orders right now. Please check back soon."
  }

  if (info.todayStatus === 'CLOSED') {
    return info.reason
      ? `This shop is closed today (${info.reason}). Please try again tomorrow or choose another shop.`
      : 'This shop is closed today. Please try again tomorrow or choose another shop.'
  }

  return info.message
}
