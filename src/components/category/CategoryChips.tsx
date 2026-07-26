import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getShopCategories } from '@/api/shops'
import type { PublicShopCategorySummary } from '@/types/api'
import { getCategoryIcon } from '@/utils/categoryIcons'

interface CategoryChipsProps {
  activeCategory?: string
  onSelect?: (category: string) => void
  className?: string
}

/**
 * Horizontal strip of shop-type tiles from `GET /public/categories`. Clicking a chip navigates to
 * `/shops?category=...` by default; pass `onSelect` to override (e.g. `ShopsPage` uses it to
 * update its own filter state in place instead of a fresh navigation).
 */
export function CategoryChips({ activeCategory, onSelect, className = '' }: CategoryChipsProps) {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<PublicShopCategorySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadCategories() {
      try {
        const response = await getShopCategories()

        if (isMounted) {
          setCategories(response.items)
        }
      } catch {
        if (isMounted) {
          setCategories([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  function handleSelect(category: string) {
    if (onSelect) {
      onSelect(category)
      return
    }

    navigate(`/shops?category=${encodeURIComponent(category)}`)
  }

  if (isLoading) {
    return (
      <div className={`flex gap-3 overflow-x-auto pb-2 ${className}`.trim()}>
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={`category-skeleton-${index}`}
            className="h-24 w-28 shrink-0 animate-pulse rounded-3xl bg-ink-50"
          />
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <div className={`flex gap-3 overflow-x-auto pb-2 ${className}`.trim()}>
      {categories.map((category) => {
        const isActive = activeCategory === category.category

        return (
          <button
            key={category.category}
            className={[
              'flex w-28 shrink-0 flex-col items-center gap-2 rounded-3xl border p-4 text-center transition-all active:scale-95',
              isActive
                ? 'border-nearkart-500 bg-nearkart-50 shadow-glass'
                : 'border-ink-100 bg-white hover:-translate-y-0.5 hover:shadow-glass',
            ].join(' ')}
            onClick={() => handleSelect(category.category)}
            type="button"
          >
            <span className="text-3xl" aria-hidden="true">
              {getCategoryIcon(category.category)}
            </span>
            <span className="text-xs font-bold text-ink-900 line-clamp-1">
              {category.category}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
              {category.shopCount} shop{category.shopCount === 1 ? '' : 's'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
