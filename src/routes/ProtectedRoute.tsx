import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

// Returns the correct home path for each role
export function getRoleHome(role?: UserRole | null): string {
  if (role === 'utility-admin') return '/utility-dashboard'
  if (role === 'it-admin')      return '/dashboard'
  if (role === 'tech-admin')    return '/dashboard'
  return '/dashboard'
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  // Show spinner while session + profile are resolving
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--gradient-brand)' }}>
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading AssetVault...</p>
        </div>
      </div>
    )
  }

  // Not logged in → login page
  if (!user) return <Navigate to="/login" replace />

  // Role restriction — redirect to THEIR home, not /dashboard
  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    return <Navigate to={getRoleHome(profile.role)} replace />
  }

  // Profile still loading but user exists — wait, don't redirect yet
  if (allowedRoles && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--gradient-brand)' }}>
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Checking permissions...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
