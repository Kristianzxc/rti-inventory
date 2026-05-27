import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import ProtectedRoute from '@/routes/ProtectedRoute'

// Public
import LoginPage          from '@/pages/LoginPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import AssetScanPage      from '@/pages/AssetScanPage'

// Dashboards
import ITDashboardPage      from '@/pages/ITDashboardPage'
import UtilityDashboardPage from '@/pages/UtilityDashboardPage'

// Assets
import ITAssetsPage      from '@/pages/ITAssetsPage'
import UtilityAssetsPage from '@/pages/UtilityAssetsPage'
import AssetDetailPage   from '@/pages/AssetDetailPage'

// Shared
import BuildingsPage    from '@/pages/BuildingsPage'
import MaintenancePage  from '@/pages/MaintenancePage'
import SettingsPage     from '@/pages/SettingsPage'
import { NotificationsPage, ProfilePage } from '@/pages/NotificationsAndProfile'

// Tech-Admin / IT-Admin
import ReportsPage      from '@/pages/ReportsPage'
import AnalyticsPage    from '@/pages/AnalyticsPage'
import UsersPage        from '@/pages/UsersPage'
import CategoriesPage   from '@/pages/Categoriespage'

// Utility
import UtilityReportsPage from '@/pages/UtilityReportsPage'
import UtilityHistoryPage from '@/pages/UtilityHistoryPage'
import ReceivedItemsPage  from '@/pages/Receiveditemspage'

function RootRedirect() {
  const { profile, loading } = useAuth()
  if (loading || !profile) return null
  if (profile.role === 'utility-admin') return <Navigate to="/utility-dashboard" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Public ── */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/scan/:id"        element={<AssetScanPage />} />

        {/* ── Root redirect ── */}
        <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />

        {/* ── IT Dashboard ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['tech-admin', 'it-admin']}>
            <ITDashboardPage />
          </ProtectedRoute>
        } />

        {/* ── Utility Dashboard ── */}
        <Route path="/utility-dashboard" element={
          <ProtectedRoute allowedRoles={['tech-admin', 'utility-admin']}>
            <UtilityDashboardPage />
          </ProtectedRoute>
        } />

        {/* ── IT Assets ── */}
        <Route path="/assets" element={
          <ProtectedRoute allowedRoles={['tech-admin', 'it-admin']}>
            <ITAssetsPage />
          </ProtectedRoute>
        } />
        <Route path="/assets/:id" element={
          <ProtectedRoute>
            <AssetDetailPage />
          </ProtectedRoute>
        } />

        {/* ── Utility Assets ── */}
        <Route path="/utility-assets" element={
          <ProtectedRoute allowedRoles={['tech-admin', 'utility-admin']}>
            <UtilityAssetsPage />
          </ProtectedRoute>
        } />

        {/* ── Utility History (Incident + Repair) ── */}
        <Route path="/utility-history" element={
          <ProtectedRoute allowedRoles={['tech-admin', 'utility-admin']}>
            <UtilityHistoryPage />
          </ProtectedRoute>
        } />

        {/* ── Shared ── */}
        <Route path="/buildings"     element={<ProtectedRoute><BuildingsPage /></ProtectedRoute>} />
        <Route path="/profile"       element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/settings"      element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* ── IT + Tech-Admin ── */}
        <Route path="/maintenance" element={
          <ProtectedRoute allowedRoles={['tech-admin', 'it-admin']}>
            <MaintenancePage />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['tech-admin', 'it-admin']}>
            <ReportsPage />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute allowedRoles={['tech-admin', 'it-admin']}>
            <AnalyticsPage />
          </ProtectedRoute>
        } />

        {/* ── Tech-Admin only ── */}
        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['tech-admin']}>
            <UsersPage />
          </ProtectedRoute>
        } />
        <Route path="/categories" element={
          <ProtectedRoute allowedRoles={['tech-admin', 'it-admin', 'utility-admin']}>
            <CategoriesPage />
          </ProtectedRoute>
        } />

        {/* ── Received Items ── */}
        <Route path="/received-items" element={
          <ProtectedRoute allowedRoles={['tech-admin', 'it-admin']}>
            <ReceivedItemsPage />
          </ProtectedRoute>
        } />

        {/* ── Utility Reports ── */}
        <Route path="/utility-reports" element={
          <ProtectedRoute allowedRoles={['tech-admin', 'utility-admin']}>
            <UtilityReportsPage />
          </ProtectedRoute>
        } />

        {/* ── 404 ── */}
        <Route path="*" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  )
}