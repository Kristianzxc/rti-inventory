import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Plus, Search, Filter, Pencil, Trash2, X, AlertTriangle,
  ArrowDownCircle, RefreshCw, ChevronDown, ChevronUp, ChevronsUpDown,
  FlaskConical, Briefcase, TrendingDown, CheckCircle, Eye,
  Calendar, BarChart2, ClipboardList
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'
import { useAuth } from '@/features/auth/AuthContext'
import { consumableService } from '@/services/consumableService'
import { formatDate } from '@/utils'
import { toast } from 'sonner'
import type { Consumable, ConsumableRestock, ConsumableWithdrawal } from '@/types/consumables'

// ─── Types ───────────────────────────────────────────────────────────────────
type TabKey = 'office' | 'maintenance'
type SortDir = 'asc' | 'desc' | null

// ─── Helper components ────────────────────────────────────────────────────────
function StockBadge({ current, threshold }: { current: number; threshold: number }) {
  const pct = threshold > 0 ? current / threshold : 1
  if (current <= 0)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
      Out of Stock
    </span>
  if (pct <= 1)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      Low Stock
    </span>
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
    style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
    OK
  </span>
}

function SortIcon({ field, sort }: { field: string; sort: { field: string; dir: SortDir } }) {
  if (sort.field !== field) return <ChevronsUpDown size={12} style={{ color: '#475569' }} />
  return sort.dir === 'asc'
    ? <ChevronUp size={12} style={{ color: '#10b981' }} />
    : <ChevronDown size={12} style={{ color: '#10b981' }} />
}

// ─── Add/Edit Consumable Modal ────────────────────────────────────────────────
function ConsumableFormModal({
  initial, type, onClose, onSave,
}: {
  initial?: Consumable | null
  type: TabKey
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    item_type: initial?.item_type || '',
    description: initial?.description || '',
    unit: initial?.unit || 'pcs',
    low_stock_threshold: initial?.low_stock_threshold ?? 5,
    type: initial?.type || type,
  })
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.item_type.trim()) { toast.error('Item Type is required'); return }
    setLoading(true)
    try {
      if (initial) {
        await consumableService.update(initial.id, form)
        toast.success('Consumable updated')
      } else {
        await consumableService.create(form)
        toast.success('Consumable added')
      }
      onSave()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const units = ['pcs', 'box', 'ream', 'litre', 'roll', 'pack', 'set', 'bottle', 'can', 'bag', 'pair']

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
        onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="w-full max-w-md glass-card p-6" style={{ boxShadow: 'var(--shadow-lg)' }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: type === 'office' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)' }}>
                {type === 'office'
                  ? <Briefcase size={17} style={{ color: '#3b82f6' }} />
                  : <FlaskConical size={17} style={{ color: '#f59e0b' }} />}
              </div>
              <div>
                <h2 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  {initial ? 'Edit Consumable' : 'Add Consumable'}
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {type === 'office' ? 'Office' : 'Maintenance'} supply
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5">
              <X size={15} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Item Type <span className="text-rose-400">*</span>
              </label>
              <input className="input-field" placeholder="e.g. Ballpen, Marker, Folder" value={form.item_type}
                onChange={e => set('item_type', e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Description
              </label>
              <textarea className="input-field resize-none" rows={2}
                placeholder="Brand, color, specifications..." value={form.description}
                onChange={e => set('description', e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Unit
              </label>
              <select className="select-field" value={form.unit} onChange={e => set('unit', e.target.value)}>
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Low Stock Alert Threshold
              </label>
              <input type="number" min={0} className="input-field" value={form.low_stock_threshold}
                onChange={e => set('low_stock_threshold', Number(e.target.value))}
                placeholder="Alert when stock falls below this number" />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                You'll see a low-stock warning when current stock ≤ this value
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : initial ? 'Save Changes' : 'Add Consumable'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Restock Modal ─────────────────────────────────────────────────────────────
function RestockModal({ consumable, onClose, onSave }: {
  consumable: Consumable; onClose: () => void; onSave: () => void
}) {
  const [form, setForm] = useState({ date_restock: new Date().toISOString().split('T')[0], stock_quantity: '', remarks: '' })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.stock_quantity || Number(form.stock_quantity) <= 0) { toast.error('Enter a valid quantity'); return }
    setLoading(true)
    try {
      await consumableService.addRestock({
        consumable_id: consumable.id,
        date_restock: form.date_restock,
        stock_quantity: Number(form.stock_quantity),
        remarks: form.remarks,
      })
      toast.success(`Restocked: +${form.stock_quantity} ${consumable.unit}`)
      onSave(); onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to restock')
    } finally { setLoading(false) }
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
        onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="w-full max-w-sm glass-card p-6" style={{ boxShadow: 'var(--shadow-lg)' }}>

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.15)' }}>
                <RefreshCw size={17} style={{ color: '#10b981' }} />
              </div>
              <div>
                <h2 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>Restock</h2>
                <p className="text-xs truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>{consumable.item_type}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5">
              <X size={15} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          {/* Current stock indicator */}
          <div className="mb-4 px-4 py-3 rounded-xl flex items-center justify-between"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Current Stock</span>
            <span className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
              {consumable.current_stock} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>{consumable.unit}</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Date Restocked</label>
              <input type="date" className="input-field" value={form.date_restock} onChange={e => set('date_restock', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Quantity to Add <span className="text-rose-400">*</span>
              </label>
              <input type="number" min={1} className="input-field" placeholder={`Amount in ${consumable.unit}`}
                value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Remarks</label>
              <input className="input-field" placeholder="Supplier, PO number, notes..." value={form.remarks} onChange={e => set('remarks', e.target.value)} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><RefreshCw size={14} /> Restock</>}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Withdraw Modal ───────────────────────────────────────────────────────────
function WithdrawModal({ consumable, onClose, onSave }: {
  consumable: Consumable; onClose: () => void; onSave: () => void
}) {
  const [form, setForm] = useState({
    date_withdrawn: new Date().toISOString().split('T')[0],
    quantity_withdrawn: '',
    withdrawn_by: '',
    purpose: '',
    department: '',
    remarks: '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const remaining = consumable.current_stock - (Number(form.quantity_withdrawn) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = Number(form.quantity_withdrawn)
    if (!qty || qty <= 0) { toast.error('Enter a valid quantity'); return }
    if (qty > consumable.current_stock) { toast.error(`Only ${consumable.current_stock} ${consumable.unit} in stock`); return }
    setLoading(true)
    try {
      await consumableService.addWithdrawal({
        consumable_id: consumable.id,
        date_withdrawn: form.date_withdrawn,
        quantity_withdrawn: qty,
        withdrawn_by: form.withdrawn_by,
        purpose: form.purpose,
        department: form.department,
        remarks: form.remarks,
      })
      toast.success(`Withdrawn: ${qty} ${consumable.unit}`)
      onSave(); onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to record withdrawal')
    } finally { setLoading(false) }
  }

  const departments = ['Coding', 'Transcription', 'MAHS', 'MAHS-EV', 'Billing-Calls', 'Billing-Aires', 'IT', 'Maintenance & Utility']

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
        onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="w-full max-w-sm glass-card p-6" style={{ boxShadow: 'var(--shadow-lg)' }}>

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.15)' }}>
                <ArrowDownCircle size={17} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <h2 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>Withdraw Stock</h2>
                <p className="text-xs truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>{consumable.item_type}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5">
              <X size={15} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          {/* Stock display */}
          <div className="mb-4 px-4 py-3 rounded-xl grid grid-cols-2 gap-2"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Current Stock</p>
              <p className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                {consumable.current_stock} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{consumable.unit}</span>
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>After Withdrawal</p>
              <p className={`text-lg font-bold font-display ${remaining < consumable.low_stock_threshold ? 'text-amber-400' : ''}`}
                style={{ color: remaining < consumable.low_stock_threshold ? undefined : 'var(--text-primary)' }}>
                {remaining < 0 ? '—' : remaining} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{consumable.unit}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Date</label>
                <input type="date" className="input-field" value={form.date_withdrawn} onChange={e => set('date_withdrawn', e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Qty <span className="text-rose-400">*</span>
                </label>
                <input type="number" min={1} max={consumable.current_stock} className="input-field"
                  placeholder={consumable.unit} value={form.quantity_withdrawn}
                  onChange={e => set('quantity_withdrawn', e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Withdrawn By</label>
              <input className="input-field" placeholder="Employee name" value={form.withdrawn_by} onChange={e => set('withdrawn_by', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Department</label>
              <select className="select-field" value={form.department} onChange={e => set('department', e.target.value)}>
                <option value="">— Select Department —</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Purpose</label>
              <input className="input-field" placeholder="What it's used for" value={form.purpose} onChange={e => set('purpose', e.target.value)} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading || consumable.current_stock <= 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#f43f5e)', boxShadow: '0 4px 12px rgba(245,158,11,0.3)', opacity: consumable.current_stock <= 0 ? 0.5 : 1 }}>
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><ArrowDownCircle size={14} /> Withdraw</>}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Transaction History Drawer ───────────────────────────────────────────────
function HistoryDrawer({ consumable, onClose }: { consumable: Consumable; onClose: () => void }) {
  const [histTab, setHistTab] = useState<'restock' | 'withdrawal'>('withdrawal')

  const { data: restocks = [], isLoading: loadingR } = useQuery({
    queryKey: ['consumable-restocks', consumable.id],
    queryFn: () => consumableService.getRestocks(consumable.id),
    staleTime: 0,
  })

  const { data: withdrawals = [], isLoading: loadingW } = useQuery({
    queryKey: ['consumable-withdrawals', consumable.id],
    queryFn: () => consumableService.getWithdrawals(consumable.id),
    staleTime: 0,
  })

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay"
        onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          className="w-full sm:max-w-2xl glass-card flex flex-col"
          style={{ boxShadow: 'var(--shadow-lg)', maxHeight: '85vh', borderRadius: '16px 16px 0 0' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.15)' }}>
                <ClipboardList size={16} style={{ color: '#8b5cf6' }} />
              </div>
              <div>
                <h2 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                  Transaction History
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{consumable.item_type}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5">
              <X size={15} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-3 px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            {[
              { label: 'Current Stock', value: `${consumable.current_stock} ${consumable.unit}`, color: consumable.current_stock <= consumable.low_stock_threshold ? '#f59e0b' : '#10b981' },
              { label: 'Total Restocked', value: `${restocks.reduce((s: number, r: any) => s + r.stock_quantity, 0)} ${consumable.unit}`, color: '#10b981' },
              { label: 'Total Withdrawn', value: `${withdrawals.reduce((s: number, w: any) => s + w.quantity_withdrawn, 0)} ${consumable.unit}`, color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} className="rounded-xl px-3 py-2.5 text-center"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            {(['withdrawal', 'restock'] as const).map(t => (
              <button key={t} onClick={() => setHistTab(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={histTab === t
                  ? { background: t === 'withdrawal' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: t === 'withdrawal' ? '#f59e0b' : '#10b981' }
                  : { color: 'var(--text-muted)' }}>
                {t === 'withdrawal' ? `Withdrawals (${withdrawals.length})` : `Restocks (${restocks.length})`}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-y-auto flex-1 px-6 py-4">
            {histTab === 'withdrawal' ? (
              loadingW
                ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>
                : withdrawals.length === 0
                  ? <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No withdrawals recorded yet.</div>
                  : <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        {['Date', 'Qty', 'Withdrawn By', 'Department', 'Purpose'].map(h => (
                          <th key={h} className="pb-2 text-left text-xs font-semibold uppercase tracking-wide pr-4"
                            style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((w: ConsumableWithdrawal) => (
                        <tr key={w.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td className="py-2.5 pr-4 text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(w.date_withdrawn)}</td>
                          <td className="py-2.5 pr-4 font-semibold" style={{ color: '#f59e0b' }}>−{w.quantity_withdrawn}</td>
                          <td className="py-2.5 pr-4 text-xs" style={{ color: 'var(--text-secondary)' }}>{w.withdrawn_by || '—'}</td>
                          <td className="py-2.5 pr-4 text-xs" style={{ color: 'var(--text-secondary)' }}>{w.department || '—'}</td>
                          <td className="py-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{w.purpose || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
            ) : (
              loadingR
                ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>
                : restocks.length === 0
                  ? <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No restocks recorded yet.</div>
                  : <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        {['Date', 'Qty Added', 'Remarks'].map(h => (
                          <th key={h} className="pb-2 text-left text-xs font-semibold uppercase tracking-wide pr-4"
                            style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {restocks.map((r: ConsumableRestock) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td className="py-2.5 pr-4 text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(r.date_restock)}</td>
                          <td className="py-2.5 pr-4 font-semibold" style={{ color: '#10b981' }}>+{r.stock_quantity}</td>
                          <td className="py-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{r.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConsumablesPage() {
  const qc = useQueryClient()
  const { isAdmin, isUtility } = useAuth()
  const canEdit = isAdmin || isUtility

  const [activeTab, setActiveTab] = useState<TabKey>('office')
  const [search, setSearch] = useState('')
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState<{ field: string; dir: SortDir }>({ field: 'item_type', dir: 'asc' })

  // Modals
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<Consumable | null>(null)
  const [deleteItem, setDeleteItem] = useState<Consumable | null>(null)
  const [restockItem, setRestockItem] = useState<Consumable | null>(null)
  const [withdrawItem, setWithdrawItem] = useState<Consumable | null>(null)
  const [historyItem, setHistoryItem] = useState<Consumable | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: allConsumables = [], isLoading } = useQuery({
    queryKey: ['consumables'],
    queryFn: () => consumableService.getAll(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['consumables'] })

  // Derived lists
  const items = useMemo(() => {
    let list = allConsumables.filter((c: Consumable) => c.type === activeTab)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((c: Consumable) =>
        c.item_type.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
      )
    }
    if (filterStock === 'low')  list = list.filter((c: Consumable) => c.current_stock <= c.low_stock_threshold && c.current_stock > 0)
    if (filterStock === 'out')  list = list.filter((c: Consumable) => c.current_stock <= 0)

    // Sort
    list = [...list].sort((a: Consumable, b: Consumable) => {
      const av = (a as any)[sort.field] ?? ''
      const bv = (b as any)[sort.field] ?? ''
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sort.dir === 'desc' ? -cmp : cmp
    })
    return list
  }, [allConsumables, activeTab, search, filterStock, sort])

  const officeItems = allConsumables.filter((c: Consumable) => c.type === 'office')
  const maintItems  = allConsumables.filter((c: Consumable) => c.type === 'maintenance')
  const lowOffice   = officeItems.filter((c: Consumable) => c.current_stock <= c.low_stock_threshold).length
  const lowMaint    = maintItems.filter((c: Consumable) => c.current_stock <= c.low_stock_threshold).length
  const totalLow    = allConsumables.filter((c: Consumable) => c.current_stock <= c.low_stock_threshold && c.current_stock > 0).length
  const totalOut    = allConsumables.filter((c: Consumable) => c.current_stock <= 0).length

  const toggleSort = (field: string) => {
    setSort(s => s.field === field
      ? { field, dir: s.dir === 'asc' ? 'desc' : s.dir === 'desc' ? null : 'asc' }
      : { field, dir: 'asc' })
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setDeleteLoading(true)
    try {
      await consumableService.delete(deleteItem.id)
      toast.success('Consumable deleted')
      invalidate()
      setDeleteItem(null)
    } catch (err: any) {
      toast.error(err.message || 'Delete failed')
    } finally { setDeleteLoading(false) }
  }

  const tabColor = activeTab === 'office' ? '#3b82f6' : '#f59e0b'
  const tabGrad  = activeTab === 'office' ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'linear-gradient(135deg,#f59e0b,#f43f5e)'

  return (
    <DashboardLayout title="Consumables">
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Package size={22} style={{ color: tabColor }} />
              Consumables
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Track office &amp; maintenance supply stock, restocks, and withdrawals
            </p>
          </div>
          {canEdit && (
            <button onClick={() => setShowAdd(true)} className="btn-primary shrink-0">
              <Plus size={15} /> Add Item
            </button>
          )}
        </div>

        {/* ── Alert strip — only when there are low/out items ── */}
        {(totalLow > 0 || totalOut > 0) && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3">
            {totalOut > 0 && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#f43f5e' }}>
                <AlertTriangle size={15} />
                <span><strong>{totalOut}</strong> item{totalOut > 1 ? 's' : ''} out of stock</span>
                <button onClick={() => setFilterStock('out')} className="ml-1 text-xs underline opacity-75 hover:opacity-100">
                  Show
                </button>
              </div>
            )}
            {totalLow > 0 && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
                <TrendingDown size={15} />
                <span><strong>{totalLow}</strong> item{totalLow > 1 ? 's' : ''} running low</span>
                <button onClick={() => setFilterStock('low')} className="ml-1 text-xs underline opacity-75 hover:opacity-100">
                  Show
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Summary stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Office Supplies', value: officeItems.length, sub: `${lowOffice} low`, icon: Briefcase, grad: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#3b82f6' },
            { label: 'Maintenance Supplies', value: maintItems.length, sub: `${lowMaint} low`, icon: FlaskConical, grad: 'linear-gradient(135deg,#f59e0b,#f43f5e)', color: '#f59e0b' },
            { label: 'Low Stock', value: totalLow, sub: 'Need restocking', icon: TrendingDown, grad: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#f59e0b' },
            { label: 'Out of Stock', value: totalOut, sub: 'Restock urgently', icon: AlertTriangle, grad: 'linear-gradient(135deg,#f43f5e,#7f1d1d)', color: '#f43f5e' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="stat-card relative overflow-hidden group cursor-default">
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                style={{ background: s.grad }} />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                  <p className="text-3xl font-display font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
                </div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: s.grad, boxShadow: `0 4px 12px ${s.color}40` }}>
                  <s.icon size={13} className="text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-full"
                style={{ background: s.grad }} />
            </motion.div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2">
          {(['office', 'maintenance'] as TabKey[]).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setFilterStock('all') }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={activeTab === tab
                ? { background: tab === 'office' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)', color: tab === 'office' ? '#3b82f6' : '#f59e0b', border: `1px solid ${tab === 'office' ? 'rgba(59,130,246,0.3)' : 'rgba(245,158,11,0.3)'}` }
                : { color: 'var(--text-muted)', border: '1px solid transparent' }}>
              {tab === 'office' ? <Briefcase size={14} /> : <FlaskConical size={14} />}
              {tab === 'office' ? 'Office Consumables' : 'Maintenance Consumables'}
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: activeTab === tab ? (tab === 'office' ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)') : 'var(--bg-tertiary)', color: 'inherit' }}>
                {tab === 'office' ? officeItems.length : maintItems.length}
              </span>
            </button>
          ))}
        </div>

        {/* ── Search + Filter bar ── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input className="input-field pl-9" placeholder="Search item type or description…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={13} style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {(['all', 'low', 'out'] as const).map(f => (
              <button key={f} onClick={() => setFilterStock(f)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={filterStock === f
                  ? { background: f === 'all' ? 'rgba(59,130,246,0.15)' : f === 'low' ? 'rgba(245,158,11,0.15)' : 'rgba(244,63,94,0.15)', color: f === 'all' ? '#3b82f6' : f === 'low' ? '#f59e0b' : '#f43f5e', border: '1px solid currentColor' }
                  : { color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                {f === 'all' ? 'All' : f === 'low' ? '⚠ Low Stock' : '🔴 Out of Stock'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {[
                    { label: 'Item Type',    field: 'item_type' },
                    { label: 'Description', field: 'description' },
                    { label: 'Unit',         field: 'unit' },
                    { label: 'Current Stock',field: 'current_stock' },
                    { label: 'Status',       field: null },
                    { label: 'Threshold',    field: 'low_stock_threshold' },
                    { label: 'Last Updated', field: 'updated_at' },
                    { label: 'Actions',      field: null },
                  ].map(col => (
                    <th key={col.label}
                      onClick={col.field ? () => toggleSort(col.field!) : undefined}
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide select-none ${col.field ? 'cursor-pointer hover:text-blue-400' : ''}`}
                      style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <div className="flex items-center gap-1">
                        {col.label}
                        {col.field && <SortIcon field={col.field} sort={sort} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="text-center py-12">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
                  </td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16">
                    <Package size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {search || filterStock !== 'all' ? 'No items match your filters.' : `No ${activeTab} consumables yet. Add one to get started.`}
                    </p>
                  </td></tr>
                ) : items.map((item: Consumable, idx: number) => {
                  const isLow = item.current_stock <= item.low_stock_threshold && item.current_stock > 0
                  const isOut = item.current_stock <= 0
                  return (
                    <motion.tr key={item.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="transition-colors"
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isOut ? 'rgba(244,63,94,0.03)' : isLow ? 'rgba(245,158,11,0.03)' : undefined,
                      }}>

                      {/* Item Type */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {(isOut || isLow) && (
                            <AlertTriangle size={13} style={{ color: isOut ? '#f43f5e' : '#f59e0b', flexShrink: 0 }} />
                          )}
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.item_type}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3">
                        <span className="text-sm block truncate max-w-[180px]" title={item.description || ''}
                          style={{ color: 'var(--text-secondary)' }}>{item.description || '—'}</span>
                      </td>

                      {/* Unit */}
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                          {item.unit}
                        </span>
                      </td>

                      {/* Current Stock — big and prominent */}
                      <td className="px-4 py-3">
                        <span className="text-xl font-bold font-display"
                          style={{ color: isOut ? '#f43f5e' : isLow ? '#f59e0b' : 'var(--text-primary)' }}>
                          {item.current_stock}
                        </span>
                      </td>

                      {/* Stock badge */}
                      <td className="px-4 py-3">
                        <StockBadge current={item.current_stock} threshold={item.low_stock_threshold} />
                      </td>

                      {/* Threshold */}
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                        ≤ {item.low_stock_threshold}
                      </td>

                      {/* Updated */}
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(item.updated_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* History */}
                          <button onClick={() => setHistoryItem(item)} title="View history"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-violet-500/10"
                            style={{ color: 'var(--text-muted)' }}>
                            <Eye size={13} />
                          </button>

                          {canEdit && (
                            <>
                              {/* Restock */}
                              <button onClick={() => setRestockItem(item)} title="Restock"
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-emerald-500/10"
                                style={{ color: '#10b981' }}>
                                <RefreshCw size={13} />
                              </button>

                              {/* Withdraw */}
                              <button onClick={() => setWithdrawItem(item)} title="Withdraw"
                                disabled={item.current_stock <= 0}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-amber-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ color: '#f59e0b' }}>
                                <ArrowDownCircle size={13} />
                              </button>

                              {/* Edit */}
                              <button onClick={() => setEditItem(item)} title="Edit"
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-blue-500/10"
                                style={{ color: 'var(--text-muted)' }}>
                                <Pencil size={13} />
                              </button>

                              {/* Delete */}
                              <button onClick={() => setDeleteItem(item)} title="Delete"
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-rose-500/10"
                                style={{ color: 'var(--text-muted)' }}>
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {items.length > 0 && (
            <div className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
              Showing {items.length} {activeTab} consumable{items.length !== 1 ? 's' : ''}
              {filterStock !== 'all' && <span className="ml-1">(filtered)</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {(showAdd || editItem) && (
        <ConsumableFormModal
          initial={editItem}
          type={activeTab}
          onClose={() => { setShowAdd(false); setEditItem(null) }}
          onSave={invalidate}
        />
      )}
      {restockItem && (
        <RestockModal consumable={restockItem} onClose={() => setRestockItem(null)} onSave={invalidate} />
      )}
      {withdrawItem && (
        <WithdrawModal consumable={withdrawItem} onClose={() => setWithdrawItem(null)} onSave={invalidate} />
      )}
      {historyItem && (
        <HistoryDrawer consumable={historyItem} onClose={() => setHistoryItem(null)} />
      )}
      {deleteItem && (
        <DeleteConfirmModal
          title="Delete Consumable"
          message={`Delete "${deleteItem.item_type}"? This will remove all restock and withdrawal history permanently.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
          loading={deleteLoading}
        />
      )}
    </DashboardLayout>
  )
}