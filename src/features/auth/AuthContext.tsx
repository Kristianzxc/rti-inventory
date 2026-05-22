import { createContext, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store'
import type { UserRole } from '@/types'

const AuthContext = createContext<null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading, fetchProfile, profile } = useAuthStore()

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          // Sync email into profiles table so it's accessible
          if (session.user.email) {
            supabase.from('profiles').update({ email: session.user.email }).eq('id', session.user.id).then(() => {})
          }
          if (profile) {
            setLoading(false)
            fetchProfile(session.user.id)
          } else {
            await fetchProfile(session.user.id)
            if (mounted) setLoading(false)
          }
        } else {
          setUser(null)
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth init:', err)
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'SIGNED_OUT') { setUser(null); setLoading(false); return }
        if (session?.user) {
          setUser(session.user)
          if (session.user.email) {
            supabase.from('profiles').update({ email: session.user.email }).eq('id', session.user.id).then(() => {})
          }
          fetchProfile(session.user.id).finally(() => { if (mounted) setLoading(false) })
        }
      }
    )

    return () => { mounted = false; subscription.unsubscribe() }
  }, []) // eslint-disable-line

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const { user, profile, loading, signOut, activeDashboard, setActiveDashboard } = useAuthStore()

  const role = profile?.role as UserRole | undefined
  const isAdmin     = role === 'tech-admin'
  const isITAdmin   = role === 'it-admin'
  const isUtility   = role === 'utility-admin'

  // What domain is currently active for this user?
  const currentDomain = isAdmin ? activeDashboard : isITAdmin ? 'it' : 'utility'

  return {
    user, profile, loading, signOut,
    isAdmin, isITAdmin, isUtility,
    role,
    activeDashboard: currentDomain,
    setActiveDashboard,
  }
}