import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, Settings, LogOut, Moon, Sun, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthContext'
import { useUIStore } from '@/store'
import { supabase } from '@/lib/supabase'

interface TopNavProps {
  title?: string
}

async function fetchRecentActivity() {
  const [assetsRes, maintRes] = await Promise.all([
    supabase.from('assets').select('id,name,asset_code,created_at').order('created_at', { ascending: false }).limit(3),
    supabase.from('maintenance_logs').select('id,status,maintenance_date,asset:assets(name)').order('maintenance_date', { ascending: false }).limit(2),
  ])
  const notifs: any[] = []
  ;(assetsRes.data || []).forEach(a => notifs.push({
    id: `a-${a.id}`, title: 'Asset Added',
    message: `${a.name}${a.asset_code ? ` (${a.asset_code})` : ''} added to inventory`,
    type: 'success', time: a.created_at,
  }))
  ;(maintRes.data || []).forEach(m => notifs.push({
    id: `m-${m.id}`,
    title: m.status === 'completed' ? 'Maintenance Done' : m.status === 'overdue' ? 'Maintenance Overdue' : 'Maintenance Scheduled',
    message: `${(m.asset as any)?.name || 'Asset'} — ${m.status}`,
    type: m.status === 'completed' ? 'success' : m.status === 'overdue' ? 'warning' : 'info',
    time: m.maintenance_date,
  }))
  return notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 4)
}

export default function TopNav({ title }: TopNavProps) {
  const { profile, signOut } = useAuth()
  const { sidebarCollapsed, darkMode, toggleDarkMode, mobileMenuOpen, setMobileMenuOpen } = useUIStore()
  const [search, setSearch] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data: notifications = [] } = useQuery({
    queryKey: ['topnav-notifications'],
    queryFn: fetchRecentActivity,
    staleTime: 30000,
    refetchInterval: 60000,
  })

  // Desktop: offset by sidebar width. Mobile: full width (no offset)
  const marginLeft = sidebarCollapsed ? 72 : 240

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <>
      {/* Desktop TopNav */}
      <header
        className="fixed top-0 right-0 z-20 h-16 items-center px-6 gap-4 transition-all duration-250 hidden md:flex"
        style={{
          left: marginLeft,
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
        }}
      >
        {title && (
          <h1 className="font-bold text-lg" style={{ color: 'var(--text-primary)', fontFamily: 'Barlow, sans-serif' }}>
            {title}
          </h1>
        )}
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && navigate(`/assets?search=${search}`)}
              placeholder="Search assets..." className="input-field pl-9 py-2 text-sm" />
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto" ref={menuRef}>
          {/* Dark/Light */}
          <button onClick={toggleDarkMode}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {/* Notifications */}
          <div className="relative">
            <button onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false) }}
              className="w-9 h-9 rounded-xl flex items-center justify-center relative"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
              <Bell size={16} />
              {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 top-11 w-80 glass-card overflow-hidden z-50"
                  style={{ boxShadow: 'var(--shadow-lg)' }}>
                  <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Recent Activity</span>
                    {notifications.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
                        {notifications.length} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0
                      ? <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No recent activity</div>
                      : notifications.map((n: any) => (
                        <div key={n.id} className="p-4 hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'warning' ? 'bg-amber-400' : n.type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{timeAgo(n.time)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="p-3 text-center">
                    <button onClick={() => { navigate('/notifications'); setNotifOpen(false) }}
                      className="text-sm font-medium" style={{ color: 'var(--accent-blue)' }}>
                      View all →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* User menu */}
          <div className="relative">
            <button onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false) }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'var(--gradient-brand)' }}>
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                {profile?.full_name?.split(' ')[0] || 'User'}
              </span>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 top-11 w-56 glass-card overflow-hidden z-50"
                  style={{ boxShadow: 'var(--shadow-lg)' }}>
                  <div className="p-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{profile?.full_name || 'User'}</p>
                    <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>{profile?.role?.replace(/-/g, ' ')}</p>
                  </div>
                  <div className="p-1.5">
                    <button onClick={() => { navigate('/profile'); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
                      style={{ color: 'var(--text-secondary)' }}>
                      <Settings size={14} /> My Profile
                    </button>
                    <button onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-white/5"
                      style={{ color: 'var(--text-secondary)' }}>
                      <Settings size={14} /> Settings
                    </button>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
                    <button onClick={signOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-rose-500/10"
                      style={{ color: 'var(--accent-rose)' }}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile TopNav */}
      <header
        className="fixed top-0 left-0 right-0 z-20 h-16 flex items-center px-4 gap-3 md:hidden"
        style={{
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary)',
        }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
          <Menu size={18} />
        </button>

        {/* Logo + title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--gradient-brand)' }}>
            <Search size={13} className="text-white" />
          </div>
          <span className="font-bold text-base truncate" style={{ color: 'var(--text-primary)', fontFamily: 'Barlow, sans-serif' }}>
            {title || 'AssetVault'}
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={toggleDarkMode}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={() => navigate('/notifications')}
            className="w-8 h-8 rounded-lg flex items-center justify-center relative"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
            <Bell size={15} />
            {notifications.length > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </button>
          <button onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'var(--gradient-brand)' }}>
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </button>
        </div>
      </header>
    </>
  )
}