import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, Bell, Shield, Palette, Database, Save, Eye, EyeOff } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [showOldPw, setShowOldPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    department: profile?.department || '',
  })

  const [pwForm, setPwForm] = useState({ old: '', new: '', confirm: '' })

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profileForm.full_name, department: profileForm.department })
        .eq('id', profile?.id || '')
      if (error) throw error
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (pwForm.new !== pwForm.confirm) {
      toast.error('Passwords do not match')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.new })
      if (error) throw error
      toast.success('Password changed!')
      setPwForm({ old: '', new: '', confirm: '' })
    } catch {
      toast.error('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'system', label: 'System', icon: Database },
  ]

  return (
    <DashboardLayout title="Settings">
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Manage your account and system preferences
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="w-52 shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`sidebar-item w-full text-left ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 glass-card p-6"
        >
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <h2 className="section-title">Profile Settings</h2>
              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                  style={{ background: 'var(--gradient-brand)' }}>
                  {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profile?.full_name || 'User'}</p>
                  <p className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                    {profile?.role?.replace('-', ' ') || 'Admin'}
                  </p>
                  <button className="text-xs mt-1" style={{ color: 'var(--accent-blue)' }}>
                    Change avatar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-text block mb-1.5">Full Name</label>
                  <input value={profileForm.full_name}
                    onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                    className="input-field" placeholder="Your full name" />
                </div>
                <div>
                  <label className="label-text block mb-1.5">Department</label>
                  <input value={profileForm.department}
                    onChange={e => setProfileForm(f => ({ ...f, department: e.target.value }))}
                    className="input-field" placeholder="e.g. IT Department" />
                </div>
                <div>
                  <label className="label-text block mb-1.5">Role</label>
                  <input value={profile?.role?.replace('-', ' ') || ''} className="input-field" disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
                  Save Profile
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <h2 className="section-title">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="label-text block mb-1.5">Current Password</label>
                  <div className="relative">
                    <input type={showOldPw ? 'text' : 'password'} value={pwForm.old}
                      onChange={e => setPwForm(f => ({ ...f, old: e.target.value }))}
                      className="input-field pr-10" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowOldPw(!showOldPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                      {showOldPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label-text block mb-1.5">New Password</label>
                  <div className="relative">
                    <input type={showNewPw ? 'text' : 'password'} value={pwForm.new}
                      onChange={e => setPwForm(f => ({ ...f, new: e.target.value }))}
                      className="input-field pr-10" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                      {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label-text block mb-1.5">Confirm New Password</label>
                  <input type="password" value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                    className="input-field" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleChangePassword} disabled={saving} className="btn-primary">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield size={15} />}
                  Change Password
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="section-title">Notification Preferences</h2>
              <div className="space-y-3">
                {[
                  { label: 'Maintenance Reminders', desc: 'Get notified when an asset is due for maintenance', enabled: true },
                  { label: 'Asset Updates', desc: 'Notifications when assets are added or modified', enabled: true },
                  { label: 'System Alerts', desc: 'Important system-level alerts', enabled: true },
                  { label: 'User Activity', desc: 'When users make significant changes', enabled: false },
                  { label: 'Weekly Reports', desc: 'Receive weekly asset summary emails', enabled: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: 'var(--bg-secondary)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${item.enabled ? 'bg-blue-500' : ''}`}
                      style={{ background: item.enabled ? 'var(--accent-blue)' : 'var(--bg-tertiary)' }}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${item.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <h2 className="section-title">Appearance</h2>
              <div>
                <label className="label-text block mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark', preview: '#0f172a' },
                    { id: 'darker', label: 'Darker', preview: '#020617' },
                    { id: 'light', label: 'Light', preview: '#f8fafc' },
                  ].map(theme => (
                    <div key={theme.id}
                      className="p-3 rounded-xl cursor-pointer border-2 transition-colors"
                      style={{ borderColor: theme.id === 'dark' ? 'var(--accent-blue)' : 'var(--border-subtle)' }}>
                      <div className="h-16 rounded-lg mb-2" style={{ background: theme.preview }} />
                      <p className="text-sm text-center font-medium" style={{ color: 'var(--text-secondary)' }}>{theme.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="label-text block mb-2">Accent Color</label>
                <div className="flex gap-2">
                  {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'].map(color => (
                    <div key={color} className="w-8 h-8 rounded-full cursor-pointer border-2 border-transparent hover:border-white transition-colors"
                      style={{ background: color }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-5">
              <h2 className="section-title">System Settings</h2>
              <div className="space-y-3">
                {[
                  { label: 'Supabase Connection', status: 'Connected', ok: true },
                  { label: 'Storage Bucket', status: 'Active', ok: true },
                  { label: 'Realtime', status: 'Enabled', ok: true },
                  { label: 'Row Level Security', status: 'Active', ok: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: 'var(--bg-secondary)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                    <span className={`badge ${item.ok ? 'badge-active' : 'badge-inactive'}`}>{item.status}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl border" style={{ borderColor: 'rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.05)' }}>
                <p className="text-sm font-semibold text-rose-400 mb-1">Danger Zone</p>
                <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  These actions are irreversible. Proceed with caution.
                </p>
                <button className="btn-danger text-sm py-2">Clear All Asset Data</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
