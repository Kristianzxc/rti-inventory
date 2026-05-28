import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Building2, Users, BarChart3,
  FileText, Settings, Wrench, Layers, ChevronLeft,
  Bell, Cpu, Armchair, ArrowLeftRight, Tag, PackageCheck, X, LogOut,ShoppingCart
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useUIStore } from '@/store'
import { classNames } from '@/utils'

const IT_NAV = [
  { label: 'Dashboard',       icon: LayoutDashboard, path: '/dashboard' },
  { label: 'IT Assets',       icon: Cpu,             path: '/assets' },
  { label: 'Received Items',  icon: PackageCheck,    path: '/received-items' },
  { label: 'Buildings',       icon: Building2,       path: '/buildings' },
  { label: 'Maintenance',     icon: Wrench,          path: '/maintenance' },
  { label: 'Categories',      icon: Tag,             path: '/categories' },
]

const IT_ADMIN_EXTRA = [
  { label: 'Reports',   icon: FileText,  path: '/reports' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Users',     icon: Users,     path: '/users' },
]

const UTILITY_NAV = [
  { label: 'Dashboard',       icon: LayoutDashboard, path: '/utility-dashboard' },
  { label: 'Utility Assets',  icon: Armchair,        path: '/utility-assets' },
  { label: 'Consumables',     icon: ShoppingCart,    path: '/consumables' },
  { label: 'Buildings',       icon: Building2,       path: '/buildings' },
  { label: 'Categories',      icon: Tag,             path: '/categories' },
  { label: 'Utility Reports', icon: FileText,        path: '/utility-reports' },
]

export default function Sidebar() {
  const { profile, isAdmin, isITAdmin, isUtility, activeDashboard, setActiveDashboard, signOut } = useAuth()
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore()
  const location = useLocation()
  const navigate = useNavigate()

  let navItems = IT_NAV
  if (isAdmin) {
    navItems = activeDashboard === 'it' ? [...IT_NAV, ...IT_ADMIN_EXTRA] : UTILITY_NAV
  } else if (isUtility) {
    navItems = UTILITY_NAV
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
    setMobileMenuOpen(false)
  }

  const handleNavClick = () => setMobileMenuOpen(false)

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-5 h-5 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--gradient-brand)' }}>
            <Layers size={16} className="text-white" />
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <span className="font-display font-bold text-lg gradient-text whitespace-nowrap">
              RTI Inventory System
            </span>
          )}
        </div>
        {isMobile ? (
          <button onClick={() => setMobileMenuOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        ) : (
          <button onClick={toggleSidebar}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}>
            <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.22 }}>
              <ChevronLeft size={16} />
            </motion.div>
          </button>
        )}
      </div>

      {/* Role badge */}
      {(!sidebarCollapsed || isMobile) && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl"
          style={{ background: roleBg, border: `1px solid ${roleBorder}` }}>
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
              <div className="flex-1 text-center py-0.5 rounded-md text-xs font-semibold cursor-pointer transition-colors"
                style={{ background: isIT ? 'var(--accent-blue)' : 'var(--bg-tertiary)', color: isIT ? 'white' : 'var(--text-muted)' }}
                onClick={() => { setActiveDashboard('it'); navigate('/dashboard'); setMobileMenuOpen(false) }}>
                IT
              </div>
              <div className="flex-1 text-center py-0.5 rounded-md text-xs font-semibold cursor-pointer transition-colors"
                style={{ background: !isIT ? '#10b981' : 'var(--bg-tertiary)', color: !isIT ? 'white' : 'var(--text-muted)' }}
                onClick={() => { setActiveDashboard('utility'); navigate('/utility-dashboard'); setMobileMenuOpen(false) }}>
                Utility
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
        {(!sidebarCollapsed || isMobile) && (
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {activeDashboard === 'it' ? 'IT Management' : 'Utility Management'}
          </p>
        )}
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && item.path !== '/utility-dashboard' && location.pathname.startsWith(item.path))
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              title={sidebarCollapsed && !isMobile ? item.label : undefined}
              className={classNames(
                'sidebar-item',
                isActive && 'active',
                sidebarCollapsed && !isMobile && 'justify-center px-0'
              )}>
              <item.icon size={18} className="shrink-0" />
              {(!sidebarCollapsed || isMobile) && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 space-y-0.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {isAdmin && (
          <button onClick={handleSwitch}
            className={classNames('sidebar-item w-full text-left', sidebarCollapsed && !isMobile && 'justify-center px-0')}
            style={{ color: isIT ? '#10b981' : 'var(--accent-blue)' } as any}>
            <ArrowLeftRight size={18} className="shrink-0" />
            {(!sidebarCollapsed || isMobile) && (
              <span className="text-sm whitespace-nowrap">
                {isIT ? 'Switch to Utility' : 'Switch to IT'}
              </span>
            )}
          </button>
        )}
        <NavLink to="/notifications" onClick={handleNavClick}
          className={classNames('sidebar-item', sidebarCollapsed && !isMobile && 'justify-center px-0')}>
          <Bell size={18} className="shrink-0" />
          {(!sidebarCollapsed || isMobile) && <span className="whitespace-nowrap flex-1">Notifications</span>}
        </NavLink>
        <NavLink to="/settings" onClick={handleNavClick}
          className={classNames('sidebar-item', sidebarCollapsed && !isMobile && 'justify-center px-0')}>
          <Settings size={18} className="shrink-0" />
          {(!sidebarCollapsed || isMobile) && <span className="whitespace-nowrap">Settings</span>}
        </NavLink>
        <button
          onClick={() => signOut()}
          title={sidebarCollapsed && !isMobile ? 'Sign Out' : undefined}
          className={classNames('sidebar-item w-full text-left', sidebarCollapsed && !isMobile && 'justify-center px-0')}
          style={{ color: '#f43f5e' }}>
          <LogOut size={18} className="shrink-0" />
          {(!sidebarCollapsed || isMobile) && <span className="whitespace-nowrap">Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 240 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="fixed left-0 top-0 bottom-0 z-30 overflow-hidden hidden md:flex flex-col"
        style={{
          background: 'rgba(9,14,26,0.97)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--border-subtle)',
        }}>
        {sidebarContent(false)}
      </motion.aside>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed left-0 top-0 bottom-0 z-30 w-72 flex flex-col md:hidden"
            style={{
              background: 'rgba(9,14,26,0.99)',
              backdropFilter: 'blur(20px)',
              borderRight: '1px solid var(--border-subtle)',
            }}>
            {sidebarContent(true)}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}