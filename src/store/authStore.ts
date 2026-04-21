import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import {
  fetchMe,
  login,
  logout,
  refreshSession,
  registerCustomer,
  registerShopOwner,
} from '@/api/auth'
import { setHttpAccessToken } from '@/api/http'
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterCustomerPayload,
  RegisterShopOwnerPayload,
} from '@/types/auth'

interface AuthStore {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  hasRestoredSession: boolean
  loading: boolean
  setSession: (session: AuthResponse) => void
  setUser: (user: AuthUser) => void
  clearSession: () => void
  login: (payload: LoginPayload) => Promise<AuthUser>
  registerCustomer: (payload: RegisterCustomerPayload) => Promise<AuthUser>
  registerShopOwner: (payload: RegisterShopOwnerPayload) => Promise<AuthUser>
  fetchMe: () => Promise<AuthUser | null>
  restoreSession: () => Promise<AuthUser | null>
  logout: () => Promise<void>
}

function applySessionState(
  set: (partial: Partial<AuthStore>) => void,
  session: AuthResponse,
) {
  setHttpAccessToken(session.accessToken)
  set({
    user: session.user,
    accessToken: session.accessToken,
    isAuthenticated: true,
    hasRestoredSession: true,
    loading: false,
  })
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      hasRestoredSession: false,
      loading: false,
      setSession: (session) => {
        applySessionState(set, session)
      },
      setUser: (user) => {
        set({
          user,
          isAuthenticated: true,
          hasRestoredSession: true,
        })
      },
      clearSession: () => {
        setHttpAccessToken(null)
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          hasRestoredSession: true,
          loading: false,
        })
      },
      login: async (payload) => {
        set({ loading: true })
        const session = await login(payload)
        applySessionState(set, session)

        return session.user
      },
      registerCustomer: async (payload) => {
        set({ loading: true })
        const session = await registerCustomer(payload)
        applySessionState(set, session)

        return session.user
      },
      registerShopOwner: async (payload) => {
        set({ loading: true })
        const session = await registerShopOwner(payload)
        applySessionState(set, session)

        return session.user
      },
      fetchMe: async () => {
        if (!get().accessToken) {
          return null
        }

        const response = await fetchMe()

        set({
          user: response.user,
          isAuthenticated: true,
        })

        return response.user
      },
      restoreSession: async () => {
        if (get().loading || get().hasRestoredSession) {
          return get().user
        }

        set({ loading: true })

        try {
          if (get().accessToken) {
            setHttpAccessToken(get().accessToken)

            try {
              const user = await get().fetchMe()

              set({
                hasRestoredSession: true,
                loading: false,
              })

              return user
            } catch {
              setHttpAccessToken(null)
            }
          }

          const session = await refreshSession()
          applySessionState(set, session)

          return session.user
        } catch {
          get().clearSession()
          return null
        } finally {
          set({
            hasRestoredSession: true,
            loading: false,
          })
        }
      },
      logout: async () => {
        try {
          await logout()
        } finally {
          get().clearSession()
        }
      },
    }),
    {
      name: 'nearkart-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        setHttpAccessToken(state?.accessToken ?? null)
      },
    },
  ),
)
