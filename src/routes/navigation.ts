// `customerOnly` items link into customer-protected routes (`ProtectedRoute` + `RoleRoute`) that
// a SHOP_OWNER/ADMIN would be bounced straight back out of onto their own dashboard — so the
// header only renders them for guests (who get a sensible login redirect) and CUSTOMER accounts,
// not for a logged-in shop owner/admin who could never actually land on them.
export const primaryNavigation = [
  { label: 'Home', to: '/', customerOnly: false },
  { label: 'Shops', to: '/shops', customerOnly: false },
  { label: 'Cart', to: '/cart', customerOnly: false },
  { label: 'Checkout', to: '/checkout', customerOnly: true },
  { label: 'Orders', to: '/orders', customerOnly: true },
] as const
