import { useState } from 'react'

import { getCategoryIcon } from '@/utils/categoryIcons'

interface ProductImageProps {
  image: string | null | undefined
  category: string | null | undefined
  name: string
  className?: string
  iconClassName?: string
}

// UI polish pass: every product-card surface (ProductCard, CrossShopProductCard, CartItemCard)
// used to fall back to a plain gray box with tiny "No image" text on a missing/broken product
// photo — inconsistent with `ShopImage.tsx`'s much nicer category-tinted gradient + icon fallback
// already used for shops, and looked distinctly unfinished on the home page's trending rail /
// search results, where most catalog items in this dataset have no photo at all. Mirrors
// `ShopImage.tsx`'s exact approach (same deterministic gradient picker, same broken-URL handling)
// so every image-shaped surface in the app degrades the same, on-brand way instead of two
// different placeholder styles coexisting.
const FALLBACK_GRADIENTS = [
  'from-nearkart-400 to-accent-500',
  'from-sun-400 to-nearkart-600',
  'from-accent-400 to-sun-500',
  'from-nearkart-500 to-sun-600',
]

function pickGradient(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % FALLBACK_GRADIENTS.length
  }
  return FALLBACK_GRADIENTS[Math.abs(hash)]
}

export function ProductImage({
  image,
  category,
  name,
  className = '',
  iconClassName = 'text-3xl',
}: ProductImageProps) {
  const [failed, setFailed] = useState(false)
  const showPhoto = Boolean(image) && !failed

  if (showPhoto) {
    return (
      <img
        alt={name}
        className={`object-cover ${className}`}
        loading="lazy"
        onError={() => setFailed(true)}
        src={image!}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br opacity-90 ${pickGradient(name)} ${className}`}
    >
      <span aria-hidden="true" className={iconClassName}>
        {getCategoryIcon(category)}
      </span>
    </div>
  )
}
