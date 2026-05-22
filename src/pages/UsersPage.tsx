import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Shield, Zap, Plus, Pencil, Trash2, Mail, Computer } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'
import { userService } from '@/services'
import { formatDate } from '@/utils'
import { toast } from 'sonner'

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  'tech-admin': {
    label: 'Tech Admin',
    icon: <Shield size={11} />,
    cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  },
  'it-admin': {
    label: 'IT Admin',
    icon: <Computer size={11} />,
    cls: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  },
  'utility-admin': {
    label: 'Utility Admin',
    icon: <Zap size={11} />,
    cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  },
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [deleteUser, setDeleteUser] = useState<any>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', role: 'it-admin', department: '' })

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  const handleDelete = async () => {
    try {
      await userService.delete(deleteUser.id)
      toast.success('User deleted')
      qc.invalidateQueries({ queryKey: ['users'] })
      setDeleteUser(null)
    } catch {
      toast.error('Failed to delete user')
    }
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editUser) {
        await userService.update(editUser.id, {
          full_name: inviteForm.full_name,
          role: inviteForm.role as any,
          department: inviteForm.department,
        })
        toast.success('User updated')
      } else {
        toast.success('Invitation sent (requires Supabase Auth setup)')
      }
      await qc.invalidateQueries({ queryKey: ['users'] })
      setShowInviteModal(false)
      setEditUser(null)
      setInviteForm({ full_name: '', email: '', role: 'it-admin', department: '' })
    } catch {
      toast.error('Failed to save user')
    }
  }

  const openEdit = (user: any) => {
    setEditUser(user)
    setInviteForm({
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'it-admin',
      department: user.department || '',
    })
    setShowInviteModal(true)
  }

  return (
    <DashboardLayout title="Users">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {users.length} users registered
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setEditUser(null); setInviteForm({ full_name: '', email: '', role: 'it-admin', department: '' }); setShowInviteModal(true) }}>
          <Plus size={15} />
          Invite User
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>No users found. Invite your first user.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.5)' }}>
                {['User', 'Role', 'Department', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user: any, i: number) => {
                const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG['it-admin']
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="table-row-hover"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                          style={{ background: 'var(--gradient-brand)' }}>
                          {user.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {user.full_name || 'Unknown User'}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Mail size={11} style={{ color: 'var(--text-muted)' }} />
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email || '—'}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className={`badge inline-flex items-center gap-1.5 ${roleCfg.cls}`}>
                        {roleCfg.icon}
                        {roleCfg.label}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {user.department || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(user)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-amber-500/20"
                          style={{ color: 'var(--text-muted)' }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteUser(user)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-rose-500/20 text-rose-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite / Edit Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowInviteModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-card p-6"
          >
            <h2 className="section-title mb-5">{editUser ? 'Edit User' : 'Invite User'}</h2>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="label-text block mb-1.5">Full Name</label>
                <input
                  value={inviteForm.full_name}
                  onChange={e => setInviteForm(f => ({ ...f, full_name: e.target.value }))}
                  className="input-field" placeholder="e.g. Juan Dela Cruz" required />
              </div>
              {!editUser && (
                <div>
                  <label className="label-text block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                    className="input-field" placeholder="user@company.com" required />
                </div>
              )}
              <div>
                <label className="label-text block mb-1.5">Role</label>
                <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))} className="select-field">
                  <option value="it-admin">IT Admin</option>
                  <option value="tech-admin">Tech Admin</option>
                  <option value="utility-admin">Utility Admin</option>
                </select>
              </div>
              <div>
                <label className="label-text block mb-1.5">Department</label>
                <input
                  value={inviteForm.department}
                  onChange={e => setInviteForm(f => ({ ...f, department: e.target.value }))}
                  className="input-field" placeholder="e.g. IT Department" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowInviteModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editUser ? 'Save Changes' : 'Send Invite'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {deleteUser && (
        <DeleteConfirmModal
          title="Delete User"
          message={`Delete "${deleteUser.full_name}"? They will lose access to the system.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteUser(null)}
        />
      )}
    </DashboardLayout>
  )
}