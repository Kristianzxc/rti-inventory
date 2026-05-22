import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Wrench, Plus, X, CheckCircle, Clock, AlertCircle, Search } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { maintenanceService, assetService } from '@/services'
import { formatDate } from '@/utils'
import { useAuthStore } from '@/store'
import { toast } from 'sonner'

export default function MaintenancePage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({
    asset_id: '',
    notes: '',
    maintenance_date: new Date().toISOString().split('T')[0],
    status: 'completed',
    cost: '',
  })

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['maintenance-logs'],
    queryFn: () => maintenanceService.getAll(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: assetsData } = useQuery({
    queryKey: ['all-assets-for-maintenance'],
    queryFn: () => assetService.getAll({}, 1, 999),
    staleTime: 0,
  })
  const allAssets = assetsData?.data || []

  const filteredLogs = logs.filter((log: any) => {
    const name = (log.asset?.name || '').toLowerCase()
    const code = (log.asset?.asset_code || '').toLowerCase()
    const matchesSearch = !search || name.includes(search.toLowerCase()) || code.includes(search.toLowerCase())
    const matchesStatus = !filterStatus || log.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await maintenanceService.create({
        ...form,
        performed_by: user?.id || '',
        cost: form.cost ? parseFloat(form.cost) : undefined,
      })
      toast.success('Maintenance log added')
      await qc.invalidateQueries({ queryKey: ['maintenance-logs'] })
      setShowModal(false)
      setForm({ asset_id: '', notes: '', maintenance_date: new Date().toISOString().split('T')[0], status: 'completed', cost: '' })
    } catch {
      toast.error('Failed to add log')
    }
  }

  const completed  = logs.filter((l: any) => l.status === 'completed').length
  const scheduled  = logs.filter((l: any) => l.status === 'scheduled').length
  const overdue    = logs.filter((l: any) => l.status === 'overdue').length

  return (
    <DashboardLayout title="Maintenance">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Maintenance Logs</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {logs.length} records total
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={15} />
          Log Maintenance
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Completed', value: completed, icon: CheckCircle, color: '#10b981' },
          { label: 'Scheduled', value: scheduled, icon: Clock,        color: '#3b82f6' },
          { label: 'Overdue',   value: overdue,   icon: AlertCircle,  color: '#f43f5e' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${s.color}20`, border: `1px solid ${s.color}40` }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Barlow, sans-serif' }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-sm" placeholder="Search by asset name or code..." />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select-field text-sm min-w-36">
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="scheduled">Scheduled</option>
          <option value="overdue">Overdue</option>
        </select>
        {(search || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterStatus('') }} className="btn-secondary text-sm">Clear</button>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {logs.length === 0 ? 'No maintenance logs yet. Log your first maintenance record.' : 'No records match your filters.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.5)' }}>
                {['Asset', 'Notes', 'Date', 'Status', 'Cost', 'Performed By'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log: any, i: number) => (
                <motion.tr key={log.id || i}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="table-row-hover" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {log.asset?.name || '—'}
                    </p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      {log.asset?.asset_code || '—'}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {log.notes ? log.notes.slice(0, 60) + (log.notes.length > 60 ? '...' : '') : '—'}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(log.maintenance_date)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge ${
                      log.status === 'completed' ? 'badge-active' :
                      log.status === 'scheduled' ? 'badge-new' : 'badge-inactive'
                    }`} style={{ textTransform: 'capitalize' }}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {log.cost ? `₱${parseFloat(log.cost).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {log.performer?.full_name || '—'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">Log Maintenance</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text block mb-1.5">Asset</label>
                <select value={form.asset_id} onChange={e => setForm(f => ({ ...f, asset_id: e.target.value }))}
                  className="select-field" required>
                  <option value="">Select an asset...</option>
                  {allAssets.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name} {a.asset_code ? `(${a.asset_code})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-text block mb-1.5">Maintenance Date</label>
                <input type="date" value={form.maintenance_date}
                  onChange={e => setForm(f => ({ ...f, maintenance_date: e.target.value }))}
                  className="input-field" required />
              </div>
              <div>
                <label className="label-text block mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="select-field">
                  <option value="completed">Completed</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="label-text block mb-1.5">Cost (₱)</label>
                <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                  className="input-field" placeholder="0.00" min="0" step="0.01" />
              </div>
              <div>
                <label className="label-text block mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="input-field resize-none" rows={3}
                  placeholder="Describe the maintenance work performed..." />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Log Maintenance</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  )
}