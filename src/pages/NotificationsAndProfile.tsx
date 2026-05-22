import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bell, Check, Package, AlertTriangle, Info, Wrench, RefreshCw, Camera } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { useAuthStore } from '@/store'
import { formatDate } from '@/utils'
import { toast } from 'sonner'

/* ─── Notifications Page ─────────────────────────────────────────────────── */

async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) {
    // Table may not exist yet — return empty gracefully
    if (error.code === '42P01') return []
    throw error
  }
  return data || []
}

const TYPE_STYLES: Record<string, { bg: string; color: string; icon: any }> = {
  warning: { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', icon: AlertTriangle },
  success: { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', icon: Check },
  info:    { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', icon: Info },
  error:   { bg: 'rgba(244,63,94,0.15)',   color: '#f43f5e', icon: AlertTriangle },
  asset:   { bg: 'rgba(139,92,246,0.15)',  color: '#8b5cf6', icon: Package },
  maintenance: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', icon: Wrench },
}

// Build live notifications from recent asset/maintenance activity as fallback
async function fetchActivityNotifications() {
  const [assetsRes, maintRes] = await Promise.all([
    supabase.from('assets').select('id,name,asset_code,status,created_at,updated_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('maintenance_logs').select('id,notes,status,maintenance_date,asset:assets(name,asset_code)').order('maintenance_date', { ascending: false }).limit(5),
  ])

  const notifs: any[] = []

  ;(assetsRes.data || []).forEach(a => {
    notifs.push({
      id: `asset-${a.id}`,
      title: 'Asset Added',
      message: `${a.name}${a.asset_code ? ` (${a.asset_code})` : ''} was added to inventory`,
      type: 'asset',
      created_at: a.created_at,
      read: false,
    })
  })

  ;(maintRes.data || []).forEach(m => {
    const assetName = (m.asset as any)?.name || 'Unknown Asset'
    notifs.push({
      id: `maint-${m.id}`,
      title: m.status === 'completed' ? 'Maintenance Completed' : m.status === 'scheduled' ? 'Maintenance Scheduled' : 'Maintenance Overdue',
      message: `${assetName}: ${m.notes ? m.notes.slice(0, 60) : 'Maintenance record'}`,
      type: m.status === 'completed' ? 'success' : m.status === 'overdue' ? 'error' : 'warning',
      created_at: m.maintenance_date,
      read: false,
    })
  })

  return notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function NotificationsPage() {
  const qc = useQueryClient()
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications-activity'],
    queryFn: fetchActivityNotifications,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // real-time: poll every 30s
  })

  const unreadCount = notifications.filter((n: any) => !readIds.has(n.id)).length

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n: any) => n.id)))
  }

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
    <DashboardLayout title="Notifications">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {unreadCount} unread · updates from asset activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-secondary text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={markAllRead} className="btn-secondary text-sm">
            Mark all as read
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 max-w-2xl">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="max-w-2xl glass-card p-12 text-center">
          <Bell size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No activity yet. Add assets or log maintenance to see notifications here.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {notifications.map((notif: any, i: number) => {
            const style = TYPE_STYLES[notif.type] || TYPE_STYLES.info
            const IconComp = style.icon
            const isRead = readIds.has(notif.id)
            return (
              <motion.div key={notif.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card p-4 flex items-start gap-4 cursor-pointer"
                style={{ borderLeft: !isRead ? `2px solid ${style.color}` : '2px solid transparent' }}
                onClick={() => setReadIds(s => new Set([...s, notif.id]))}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: style.bg }}>
                  <IconComp size={18} style={{ color: style.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{notif.title}</p>
                    {!isRead && <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />}
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{notif.message}</p>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{timeAgo(notif.created_at)}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setReadIds(s => new Set([...s, notif.id])) }}
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ color: 'var(--text-muted)' }}>
                  <Check size={13} />
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}

/* ─── Profile Page ───────────────────────────────────────────────────────── */

const ROLE_LABELS: Record<string, string> = {
  'tech-admin':    'Tech Admin',
  'it-admin':      'IT Admin',
  'utility-admin': 'Utility Admin',
}

export function ProfilePage() {
  const { user, profile } = useAuth()
  const { fetchProfile } = useAuthStore()
  const qc = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', department: '' })
  const [saving, setSaving] = useState(false)

  // Fetch real asset + maintenance stats for this user
  const { data: assetStats } = useQuery({
    queryKey: ['profile-asset-stats', user?.id],
    queryFn: async () => {
      const [assetsRes, maintRes] = await Promise.all([
        supabase.from('assets').select('id', { count: 'exact', head: true }).eq('created_by', user!.id),
        supabase.from('maintenance_logs').select('id', { count: 'exact', head: true }).eq('performed_by', user!.id),
      ])
      return {
        assetsAdded: assetsRes.count || 0,
        maintenanceLogs: maintRes.count || 0,
      }
    },
    enabled: !!user?.id,
    staleTime: 0,
  })

  const startEdit = () => {
    setForm({ full_name: profile?.full_name || '', department: profile?.department || '' })
    setEditing(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    try {
      await supabase.from('profiles').update({ full_name: form.full_name, department: form.department }).eq('id', user.id)
      await fetchProfile(user.id)
      await qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Profile updated')
      setEditing(false)
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const initial = profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
  const roleLabel = ROLE_LABELS[profile?.role || ''] || profile?.role || 'User'

  return (
    <DashboardLayout title="Profile">
      <div className="mb-6">
        <h1 className="page-title">My Profile</h1>
      </div>

      <div className="max-w-lg space-y-4">
        {/* Profile card */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold select-none"
                style={{ background: 'var(--gradient-brand)', color: 'white', fontFamily: 'Barlow, sans-serif' }}>
                {initial}
              </div>
            </div>
            <div className="flex-1">
              {editing ? (
                <form onSubmit={handleSave} className="space-y-2">
                  <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className="input-field text-sm" placeholder="Full name" required />
                  <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="input-field text-sm" placeholder="Department (optional)" />
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={saving} className="btn-primary text-sm py-1.5 px-3">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className="btn-secondary text-sm py-1.5 px-3">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Barlow, sans-serif' }}>
                    {profile?.full_name || 'Unknown User'}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {roleLabel}{profile?.department ? ` — ${profile.department}` : ''}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {user?.email || '—'}
                  </p>
                  <button onClick={startEdit} className="btn-secondary text-xs py-1 px-2.5 mt-2">
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-2 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            {[
              { label: 'Email',       value: user?.email || '—' },
              { label: 'Role',        value: roleLabel },
              { label: 'Department',  value: profile?.department || '—' },
              { label: 'Member Since',value: profile?.created_at ? formatDate(profile.created_at) : '—' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-1.5">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Assets Added',      value: assetStats?.assetsAdded      ?? 0 },
            { label: 'Maintenance Logs',  value: assetStats?.maintenanceLogs  ?? 0 },
          ].map(stat => (
            <div key={stat.label} className="glass-card p-4">
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Barlow, sans-serif' }}>{stat.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}