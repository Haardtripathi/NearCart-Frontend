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
  // `dairy` deliberately ordered before `bakery` — the inventory bridge's real product-category
  // taxonomy has a combined "Dairy & Bakery" category (confirmed live: milk/butter products are
  // filed under it), which contains both words as substrings. There's no objectively "correct"
  // choice between the two for a combined category, but milk/butter reading as a croissant looked
  // like a mismatch worth avoiding, and this ordering is what the substring-match priority below
  // keys off for ties between two equally-valid single-word matches.
  dairy: '🥛',
  bakery: '🥐',
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

  const normalized = category.trim().toLowerCase()
  const exactMatch = categoryIconMap[normalized]

  if (exactMatch) {
    return exactMatch
  }

  // UI polish pass: this map was built for the flat, single-word `Shop.category` (shop-type)
  // string, so it only ever did an exact match — fine for shops, but product-level categories
  // (e.g. "Dairy & Bakery", "Staples & Grains" from the inventory bridge's own category taxonomy)
  // almost never match a whole key exactly, so every product fell back to the same generic
  // storefront icon regardless of what it actually was (`ProductImage.tsx`'s fallback, used across
  // the home trending rail, search results, and cart). A substring check against each known key
  // gives products real per-category icon variety (a bakery item now gets 🥐, not 🏬) without a
  // second, duplicate icon map to maintain. Multi-word phrases ("pet store", "general store") are
  // checked before single-word keys so a more specific compound key wins over a shorter substring
  // it happens to contain (e.g. "pet"); among same-specificity single-word keys, whichever is
  // defined earlier in the map above wins (a stable sort preserves that — see e.g. `dairy` being
  // deliberately ordered before `bakery` for the "Dairy & Bakery" combined category case).
  const sortedKeys = Object.keys(categoryIconMap).sort(
    (a, b) => (b.includes(' ') ? 1 : 0) - (a.includes(' ') ? 1 : 0),
  )
  const substringMatch = sortedKeys.find((key) => normalized.includes(key))

  return substringMatch ? categoryIconMap[substringMatch] : fallbackIcon
}
