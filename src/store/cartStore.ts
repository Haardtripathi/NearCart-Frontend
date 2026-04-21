import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { CartAddResult, CartItem, CartSnapshot } from '@/types/cart'

interface AddItemOptions {
  forceReplace?: boolean
}

interface CartStore extends CartSnapshot {
  addItem: (item: CartItem, options?: AddItemOptions) => CartAddResult
  removeItem: (cartItemId: string) => void
  increaseQty: (cartItemId: string) => void
  decreaseQty: (cartItemId: string) => void
  updateQty: (cartItemId: string, quantity: number) => void
  replaceCart: (snapshot: CartSnapshot) => void
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

  return Math.min(
    Math.max(minimumQuantity, normalizedQuantity),
    Math.max(minimumQuantity, item.stockQty),
  )
}

function withUpdatedItemQuantity(
  items: CartItem[],
  cartItemId: string,
  updater: (item: CartItem) => number,
) {
  return items.map((item) =>
    item.cartItemId === cartItemId
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
        if (item.stockStatus === 'OUT_OF_STOCK' || item.stockQty <= 0) {
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
            (cartItem) => cartItem.cartItemId === nextItem.cartItemId,
          )

          const items = existingItem
            ? baseItems.map((cartItem) =>
                cartItem.cartItemId === nextItem.cartItemId
                  ? {
                      ...cartItem,
                      ...nextItem,
                      quantity: clampQuantity(
                        nextItem,
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
      removeItem: (cartItemId) => {
        set((state) => {
          const items = state.items.filter((item) => item.cartItemId !== cartItemId)

          if (items.length === 0) {
            return initialCartState
          }

          return { items }
        })
      },
      increaseQty: (cartItemId) => {
        set((state) => ({
          items: withUpdatedItemQuantity(state.items, cartItemId, (item) =>
            Math.min(item.quantity + 1, item.stockQty),
          ),
        }))
      },
      decreaseQty: (cartItemId) => {
        set((state) => ({
          items: withUpdatedItemQuantity(state.items, cartItemId, (item) =>
            Math.max(1, item.quantity - 1),
          ),
        }))
      },
      updateQty: (cartItemId, quantity) => {
        set((state) => ({
          items: withUpdatedItemQuantity(state.items, cartItemId, () => quantity),
        }))
      },
      replaceCart: (snapshot) => {
        set({
          ...snapshot,
          items: snapshot.items.map((item) => ({
            ...item,
            quantity: clampQuantity(item, item.quantity),
          })),
        })
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
      name: 'nearkart-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        shopId: state.shopId,
        shopName: state.shopName,
        items: state.items,
      }),
    },
  ),
)
