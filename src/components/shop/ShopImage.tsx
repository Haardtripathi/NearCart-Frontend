import { useState } from 'react'

import { getCategoryIcon } from '@/utils/categoryIcons'

interface ShopImageProps {
  logoImageUrl: string | null | undefined
  category: string | null | undefined
  name: string
  className?: string
  iconClassName?: string
}

// A small set of on-brand gradient pairs (orange/red/gold family only — no purple/blue/pink, per
// the existing design tokens in index.css) to fall back on when a shop has no photo yet. Picked
// deterministically from the shop name so the same shop always gets the same fallback color
// instead of flickering between renders.
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

/**
 * Renders a shop's real `logoImageUrl` when it has one, and a category-tinted gradient + icon
 * otherwise — replaces the previous behavior of always showing a generic emoji regardless of
 * whether a real photo exists (see ShopCard.tsx / ShopDetailsPage.tsx history). Also falls back
 * gracefully if the URL is set but the image fails to load (broken Cloudinary link, etc.).
 */
export function ShopImage({ logoImageUrl, category, name, className = '', iconClassName = 'text-4xl' }: ShopImageProps) {
  const [failed, setFailed] = useState(false)
  const showPhoto = Boolean(logoImageUrl) && !failed

  if (showPhoto) {
    return (
      <img
        alt={`${name} storefront`}
        className={`object-cover ${className}`}
        loading="lazy"
        onError={() => setFailed(true)}
        src={logoImageUrl!}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${pickGradient(name)} ${className}`}
    >
      <span aria-hidden="true" className={iconClassName}>
        {getCategoryIcon(category)}
      </span>
    </div>
  )
}
