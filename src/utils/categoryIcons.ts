/**
 * Emoji map keyed by the flat `Shop.category` string (shop-type, e.g. "Grocery"/"Pharmacy" — see
 * `GET /public/categories`). Purely presentational; unknown categories fall back to a generic
 * shop icon rather than throwing, since this string is free-text set by shop owners.
 */
const categoryIconMap: Record<string, string> = {
  grocery: '🛒',
  groceries: '🛒',
  supermarket: '🛒',
  pharmacy: '💊',
  medical: '💊',
  bakery: '🥐',
  dairy: '🥛',
  meat: '🥩',
  butcher: '🥩',
  seafood: '🐟',
  fish: '🐟',
  vegetables: '🥦',
  fruits: '🍎',
  produce: '🥬',
  electronics: '🔌',
  stationery: '✏️',
  books: '📚',
  clothing: '👕',
  fashion: '👗',
  footwear: '👟',
  hardware: '🔧',
  general: '🏪',
  'general store': '🏪',
  restaurant: '🍽️',
  food: '🍽️',
  cafe: '☕',
  bar: '🍹',
  sweets: '🍬',
  confectionery: '🍬',
  pet: '🐾',
  petstore: '🐾',
  'pet store': '🐾',
  beauty: '💄',
  cosmetics: '💄',
  toys: '🧸',
  gifts: '🎁',
  flowers: '💐',
  florist: '💐',
  liquor: '🍾',
  wine: '🍷',
}

const fallbackIcon = '🏬'

export function getCategoryIcon(category: string | null | undefined): string {
  if (!category) {
    return fallbackIcon
  }

  return categoryIconMap[category.trim().toLowerCase()] ?? fallbackIcon
}
