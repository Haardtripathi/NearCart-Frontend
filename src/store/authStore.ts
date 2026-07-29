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
import { registerUnauthorizedHandlers, setHttpAccessToken } from '@/api/http'
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
  isRestoringSession: boolean
  loading: boolean
  // Tracks which user ids have already been through the post-verification onboarding wizard
  // (welcome -> address -> notifications), so it only ever shows once per account. Keyed by
  // user id (not a single boolean) because more than one account can log into the same
  // browser/localStorage over time.
  onboardingCompletedUserIds: string[]
  setSession: (session: AuthResponse) => void
  setUser: (user: AuthUser) => void
  clearSession: () => void
  login: (payload: LoginPayload) => Promise<AuthUser>
  registerCustomer: (payload: RegisterCustomerPayload) => Promise<AuthUser>
  registerShopOwner: (payload: RegisterShopOwnerPayload) => Promise<AuthUser>
  fetchMe: () => Promise<AuthUser | null>
  restoreSession: () => Promise<AuthUser | null>
  logout: () => Promise<void>
  hasCompletedOnboarding: (userId: string) => boolean
  markOnboardingComplete: (userId: string) => void
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
    isRestoringSession: false,
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
      isRestoringSession: false,
      loading: false,
      onboardingCompletedUserIds: [],
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
          isRestoringSession: false,
          loading: false,
        })
      },
      login: async (payload) => {
        set({ loading: true })
        try {
          const session = await login(payload)
          applySessionState(set, session)

          return session.user
        } finally {
          set({ loading: false })
        }
      },
      registerCustomer: async (payload) => {
        set({ loading: true })
        try {
          const session = await registerCustomer(payload)
          applySessionState(set, session)

          return session.user
        } finally {
          set({ loading: false })
        }
      },
      registerShopOwner: async (payload) => {
        set({ loading: true })
        try {
          const session = await registerShopOwner(payload)
          applySessionState(set, session)

          return session.user
        } finally {
          set({ loading: false })
        }
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
        if (get().isRestoringSession || get().hasRestoredSession) {
          return get().user
        }

        set({ isRestoringSession: true })

        try {
          if (get().accessToken) {
            setHttpAccessToken(get().accessToken)

            try {
              const user = await get().fetchMe()

              set({
                hasRestoredSession: true,
                isRestoringSession: false,
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
            isRestoringSession: false,
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
      hasCompletedOnboarding: (userId) => get().onboardingCompletedUserIds.includes(userId),
      markOnboardingComplete: (userId) => {
        set({
          onboardingCompletedUserIds: get().onboardingCompletedUserIds.includes(userId)
            ? get().onboardingCompletedUserIds
            : [...get().onboardingCompletedUserIds, userId],
        })
      },
    }),
    {
      name: 'nearkart-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        onboardingCompletedUserIds: state.onboardingCompletedUserIds,
      }),
      onRehydrateStorage: () => (state) => {
        setHttpAccessToken(state?.accessToken ?? null)
      },
    },
  ),
)

// Lets `httpClient` (src/api/http.ts) transparently refresh an expired access token and retry a
// request that 401'd mid-session, instead of leaving the user stuck until a hard page reload.
// Only engages once `restoreSession()` has already run once (see `hasRestoredSession` below), so
// it never races with that initial bootstrap flow's own fallback-to-refresh logic.
registerUnauthorizedHandlers({
  hasRestoredSession: () => useAuthStore.getState().hasRestoredSession,
  refresh: async () => {
    try {
      const session = await refreshSession()
      applySessionState(useAuthStore.setState, session)

      return session.accessToken
    } catch {
      return null
    }
  },
  onRefreshFailed: () => {
    useAuthStore.getState().clearSession()
  },
})
