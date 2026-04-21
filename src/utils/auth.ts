import type { UserRole } from '@/types/auth'

export function getDashboardPathForRole(role: UserRole) {
  switch (role) {
    case 'CUSTOMER':
      return '/dashboard/customer'
    case 'SHOP_OWNER':
      return '/dashboard/shop-owner'
    case 'ADMIN':
      return '/dashboard/admin'
    case 'RIDER':
      return '/dashboard'
    default:
      return '/dashboard'
  }
}

export function formatRoleLabel(role?: UserRole | string) {
  if (!role) {
    return 'Unknown'
  }

  return role
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}
