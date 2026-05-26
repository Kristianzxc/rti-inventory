import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { Profile, AssetDomain } from '@/types'

interface AuthState {
  user: any | null
  profile: Profile | null
  loading: boolean
  // tech-admin can switch active dashboard view
  activeDashboard: AssetDomain
  setUser: (user: any) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setActiveDashboard: (domain: AssetDomain) => void
  fetchProfile: (userId: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      loading: true,
      activeDashboard: 'it',

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      setActiveDashboard: (domain) => set({ activeDashboard: domain }),

      fetchProfile: async (userId: string) => {
        try {
          const result = await Promise.race([
            supabase.from('profiles').select('*').eq('id', userId).single(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 5000)
            ),
          ])
          const { data, error } = result as any
          if (error) throw error
          // Set activeDashboard based on role when profile first loads
          set((state) => ({
            profile: data as Profile,
            activeDashboard:
              (data as Profile).role === 'utility-admin'
                ? 'utility'
                : state.activeDashboard,
          }))
        } catch (err) {
          console.error('fetchProfile:', err)
          set({ profile: null })
        }
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null, loading: false, activeDashboard: 'it' })
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        profile: state.profile,
        activeDashboard: state.activeDashboard,
      }),
    }
  )
)

// UI Store
interface UIState {
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean
  darkMode: boolean
  activeModal: string | null
  toggleSidebar: () => void
  setMobileMenuOpen: (open: boolean) => void
  toggleDarkMode: () => void
  openModal: (modal: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      darkMode: true,
      activeModal: null,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleDarkMode: () => {
        const next = !get().darkMode
        set({ darkMode: next })
        if (next) {
          document.documentElement.classList.remove('light-mode')
        } else {
          document.documentElement.classList.add('light-mode')
        }
      },
      openModal: (modal) => set({ activeModal: modal }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'ui-store',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, darkMode: s.darkMode }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.darkMode) {
          document.documentElement.classList.add('light-mode')
        } else {
          document.documentElement.classList.remove('light-mode')
        }
      },
    }
  )
)