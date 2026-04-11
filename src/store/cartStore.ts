import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { CartAddResult, CartItem, CartSnapshot } from '@/types/cart'

interface AddItemOptions {
  forceReplace?: boolean
}

interface CartStore extends CartSnapshot {
  addItem: (item: CartItem, options?: AddItemOptions) => CartAddResult
  removeItem: (storeProductId: string) => void
  increaseQty: (storeProductId: string) => void
  decreaseQty: (storeProductId: string) => void
  updateQty: (storeProductId: string, quantity: number) => void
  clearCart: () => void
  getCartCount: () => number
  getCartSubtotal: () => number
}

const initialCartState: CartSnapshot = {
  shopId: null,
  shopName: null,
  items: [],
}

function clampQuantity(item: CartItem, quantity: number) {
  const minimumQuantity = 1
  const normalizedQuantity = Number.isFinite(quantity)
    ? Math.floor(quantity)
    : minimumQuantity

  if (item.stockQty == null || item.stockQty < minimumQuantity) {
    return Math.max(minimumQuantity, normalizedQuantity)
  }

  return Math.min(Math.max(minimumQuantity, normalizedQuantity), item.stockQty)
}

function withUpdatedItemQuantity(
  items: CartItem[],
  storeProductId: string,
  updater: (item: CartItem) => number,
) {
  return items.map((item) =>
    item.storeProductId === storeProductId
      ? {
          ...item,
          quantity: clampQuantity(item, updater(item)),
        }
      : item,
  )
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialCartState,
      addItem: (item, options) => {
        if (item.stockStatus === 'OUT_OF_STOCK') {
          return {
            added: false,
            replaced: false,
            requiresConfirmation: false,
            conflictShopName: null,
          }
        }

        const state = get()
        const hasDifferentShopItems =
          state.items.length > 0 && state.shopId !== item.shopId

        if (hasDifferentShopItems && !options?.forceReplace) {
          return {
            added: false,
            replaced: false,
            requiresConfirmation: true,
            conflictShopName: state.shopName,
          }
        }

        const nextItem = {
          ...item,
          quantity: clampQuantity(item, item.quantity),
        }

        set((currentState) => {
          const baseItems = options?.forceReplace ? [] : currentState.items
          const existingItem = baseItems.find(
            (cartItem) => cartItem.storeProductId === nextItem.storeProductId,
          )

          const items = existingItem
            ? baseItems.map((cartItem) =>
                cartItem.storeProductId === nextItem.storeProductId
                  ? {
                      ...cartItem,
                      quantity: clampQuantity(
                        cartItem,
                        cartItem.quantity + nextItem.quantity,
                      ),
                    }
                  : cartItem,
              )
            : [...baseItems, nextItem]

          return {
            shopId: nextItem.shopId,
            shopName: nextItem.shopName,
            items,
          }
        })

        return {
          added: true,
          replaced: hasDifferentShopItems,
          requiresConfirmation: false,
          conflictShopName: hasDifferentShopItems ? state.shopName : null,
        }
      },
      removeItem: (storeProductId) => {
        set((state) => {
          const items = state.items.filter(
            (item) => item.storeProductId !== storeProductId,
          )

          if (items.length === 0) {
            return initialCartState
          }

          return { items }
        })
      },
      increaseQty: (storeProductId) => {
        set((state) => ({
          items: withUpdatedItemQuantity(state.items, storeProductId, (item) => {
            const maximumQuantity = item.stockQty ?? item.quantity + 1

            return Math.min(item.quantity + 1, maximumQuantity)
          }),
        }))
      },
      decreaseQty: (storeProductId) => {
        set((state) => ({
          items: withUpdatedItemQuantity(state.items, storeProductId, (item) =>
            Math.max(1, item.quantity - 1),
          ),
        }))
      },
      updateQty: (storeProductId, quantity) => {
        set((state) => ({
          items: withUpdatedItemQuantity(
            state.items,
            storeProductId,
            () => quantity,
          ),
        }))
      },
      clearCart: () => {
        set(initialCartState)
      },
      getCartCount: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
      getCartSubtotal: () =>
        get().items.reduce(
          (subtotal, item) => subtotal + item.price * item.quantity,
          0,
        ),
    }),
    {
      name: 'nearcart-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        shopId: state.shopId,
        shopName: state.shopName,
        items: state.items,
      }),
    },
  ),
)
