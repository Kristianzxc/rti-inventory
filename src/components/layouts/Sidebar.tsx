import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, Building2, Users, BarChart3,
  FileText, Settings, Wrench, Layers, ChevronLeft,
  Bell, Cpu, Armchair, ArrowLeftRight, Tag, PackageCheck
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useUIStore } from '@/store'
import { classNames } from '@/utils'

// Nav items per domain/role
const IT_NAV = [
  { label: 'Dashboard',       icon: LayoutDashboard, path: '/dashboard' },
  { label: 'IT Assets',       icon: Cpu,             path: '/assets' },
  { label: 'Received Items',  icon: PackageCheck,    path: '/received-items' },
  { label: 'Buildings',       icon: Building2,       path: '/buildings' },
  { label: 'Maintenance',     icon: Wrench,          path: '/maintenance' },
  { label: 'Categories',      icon: Tag,             path: '/categories' },
]

const IT_ADMIN_EXTRA = [
  { label: 'Reports',      icon: FileText,        path: '/reports' },
  { label: 'Analytics',    icon: BarChart3,       path: '/analytics' },
  { label: 'Users',        icon: Users,           path: '/users' },
]

const UTILITY_NAV = [
  { label: 'Dashboard',        icon: LayoutDashboard, path: '/utility-dashboard' },
  { label: 'Utility Assets',   icon: Armchair,        path: '/utility-assets' },
  { label: 'Buildings',        icon: Building2,       path: '/buildings' },
  { label: 'Categories',       icon: Tag,             path: '/categories' },
  { label: 'Utility Reports',  icon: FileText,        path: '/utility-reports' },
]

export default function Sidebar() {
  const { profile, isAdmin, isITAdmin, isUtility, activeDashboard, setActiveDashboard } = useAuth()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const location = useLocation()
  const navigate = useNavigate()

  // Determine nav items
  let navItems = IT_NAV
  if (isAdmin) {
    navItems = activeDashboard === 'it'
      ? [...IT_NAV, ...IT_ADMIN_EXTRA]
      : UTILITY_NAV
  } else if (isUtility) {
    navItems = UTILITY_NAV
  } else {
    // it-admin
    navItems = IT_NAV
  }

  const isIT      = activeDashboard === 'it'
  const roleLabel = isAdmin ? 'Tech Admin' : isITAdmin ? 'IT Admin' : 'Utility Admin'
  const roleColor = isAdmin ? '#3b82f6' : isITAdmin ? '#06b6d4' : '#10b981'
  const roleBg    = isAdmin ? 'rgba(59,130,246,0.1)' : isITAdmin ? 'rgba(6,182,212,0.1)' : 'rgba(16,185,129,0.1)'
  const roleBorder= isAdmin ? 'rgba(59,130,246,0.2)' : isITAdmin ? 'rgba(6,182,212,0.2)' : 'rgba(16,185,129,0.2)'

  const handleSwitch = () => {
    const next = activeDashboard === 'it' ? 'utility' : 'it'
    setActiveDashboard(next)
    navigate(next === 'it' ? '/dashboard' : '/utility-dashboard')
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className="fixed left-0 top-0 bottom-0 z-30 flex flex-col overflow-hidden"
      style={{
        background: 'rgba(9,14,26,0.97)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--gradient-brand)' }}>
            <Layers size={16} className="text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-display font-bold text-lg gradient-text whitespace-nowrap overflow-hidden"
              >
                AssetVault
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button onClick={toggleSidebar}
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-muted)' }}>
          <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.22 }}>
            <ChevronLeft size={16} />
          </motion.div>
        </button>
      </div>

      {/* Role + dashboard badge */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-3 mt-3 px-3 py-2.5 rounded-xl"
            style={{ background: roleBg, border: `1px solid ${roleBorder}` }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: roleColor }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: roleColor }}>
                {roleLabel}
              </p>
            </div>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {profile?.full_name || 'User'}
            </p>
            {isAdmin && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className={`flex-1 text-center py-0.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${isIT ? 'text-white' : ''}`}
                  style={{ background: isIT ? 'var(--accent-blue)' : 'var(--bg-tertiary)', color: isIT ? 'white' : 'var(--text-muted)' }}
                  onClick={() => { setActiveDashboard('it'); navigate('/dashboard') }}>
                  IT
                </div>
                <div className={`flex-1 text-center py-0.5 rounded-md text-xs font-semibold cursor-pointer transition-colors`}
                  style={{ background: !isIT ? '#10b981' : 'var(--bg-tertiary)', color: !isIT ? 'white' : 'var(--text-muted)' }}
                  onClick={() => { setActiveDashboard('utility'); navigate('/utility-dashboard') }}>
                  Utility
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-hidden py-3 px-2 space-y-0.5">
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              {activeDashboard === 'it' ? 'IT Management' : 'Utility Management'}
            </motion.p>
          )}
        </AnimatePresence>

        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && item.path !== '/utility-dashboard' && location.pathname.startsWith(item.path))
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={sidebarCollapsed ? item.label : undefined}
              className={classNames('sidebar-item', isActive && 'active', sidebarCollapsed && 'justify-center px-0')}
            >
              <item.icon size={18} className="shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-2 space-y-0.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {/* Switch dashboard button — only for tech-admin */}
        {isAdmin && (
          <button
            onClick={handleSwitch}
            title={sidebarCollapsed ? `Switch to ${isIT ? 'Utility' : 'IT'} Dashboard` : undefined}
            className={classNames('sidebar-item w-full text-left', sidebarCollapsed && 'justify-center px-0')}
            style={{ color: isIT ? '#10b981' : 'var(--accent-blue)' } as any}
          >
            <ArrowLeftRight size={18} className="shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="overflow-hidden whitespace-nowrap text-sm">
                  {isIT ? 'Switch to Utility' : 'Switch to IT'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}

        <NavLink to="/notifications"
          title={sidebarCollapsed ? 'Notifications' : undefined}
          className={classNames('sidebar-item', sidebarCollapsed && 'justify-center px-0')}>
          <Bell size={18} className="shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="overflow-hidden whitespace-nowrap flex-1">Notifications</motion.span>
            )}
          </AnimatePresence>
        </NavLink>

        <NavLink to="/settings"
          title={sidebarCollapsed ? 'Settings' : undefined}
          className={classNames('sidebar-item', sidebarCollapsed && 'justify-center px-0')}>
          <Settings size={18} className="shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="overflow-hidden whitespace-nowrap">Settings</motion.span>
            )}
          </AnimatePresence>
        </NavLink>


      </div>
    </motion.aside>
  )
}