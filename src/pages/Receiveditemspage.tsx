import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PackageCheck, Plus, Search, Pencil, Trash2,
  X, Calendar, User, Building2, Package, Hash, Loader2,
  Sparkles, RefreshCw, ThumbsUp, Tag as TagIcon,
  ChevronLeft, ChevronRight,
  ArrowRightLeft
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'
import { receivedItemService, assetService, buildingService, categoryService } from '@/services'
import { useAuth } from '@/features/auth/AuthContext'
import { formatDate } from '@/utils'
import { toast } from 'sonner'
import type { ReceivedItem } from '@/types'

// ── Condition config ──────────────────────────────────────────
const CONDITION_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  new:         { label: 'New',         color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: <Sparkles size={11} /> },
  recycle:     { label: 'Recycle',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: <RefreshCw size={11} /> },
  good_as_new: { label: 'Good as New', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: <ThumbsUp size={11} /> },
  used:        { label: 'Used',        color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: <TagIcon size={11} /> },
}

function ConditionBadge({ condition }: { condition: string }) {
  const c = CONDITION_CFG[condition] || CONDITION_CFG.used
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.color}30` }}>
      {c.icon}{c.label}
    </span>
  )
}

// ── Field component ───────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}

const INPUT = "w-full px-3 py-2 rounded-xl text-sm outline-none transition-colors"
const IS = { background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }

// ── Add / Edit Modal ──────────────────────────────────────────
function ReceivedItemModal({
  item, onClose, onSuccess,
}: { item?: ReceivedItem | null; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!item
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date_received:              item?.date_received              || new Date().toISOString().slice(0, 10),
    item:                       item?.item                       || '',
    quantity:                   item?.quantity?.toString()       || '1',
    unit:                       item?.unit                       || 'pcs',
    condition:                  item?.condition                  || 'new',
    delivered_by:               item?.delivered_by               || '',
    received_by:                item?.received_by                || '',
    temporary_building_storage: item?.temporary_building_storage || '',
    assigned_transferred_to:    item?.assigned_transferred_to    || '',
    transferred_by:             item?.transferred_by             || '',
    date_transferred:           item?.date_transferred           || '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.item.trim()) { toast.error('Item name is required'); return }
    if (!form.date_received) { toast.error('Date received is required'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        quantity:                   parseFloat(form.quantity) || 1,
        condition:                  form.condition as ReceivedItem['condition'],
        delivered_by:               form.delivered_by               || null,
        received_by:                form.received_by                || null,
        temporary_building_storage: form.temporary_building_storage || null,
        assigned_transferred_to:    form.assigned_transferred_to    || null,
        transferred_by:             form.transferred_by             || null,
        date_transferred:           form.date_transferred           || null,
        asset_id:                   item?.asset_id                  || null,
        created_by:                 null,
      }
      if (isEdit) {
        await receivedItemService.update(item!.id, payload)
        toast.success('Item updated')
      } else {
        await receivedItemService.create(payload)
        toast.success('Item added')
      }
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
              <PackageCheck size={16} className="text-white" />
            </div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {isEdit ? 'Edit Received Item' : 'Add Received Item'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date Received *">
              <input type="date" value={form.date_received} onChange={set('date_received')}
                className={INPUT} style={IS} />
            </Field>
            <Field label="Condition">
              <select value={form.condition} onChange={set('condition')} className={INPUT} style={IS}>
                <option value="new">New</option>
                <option value="recycle">Recycle</option>
                <option value="good_as_new">Good as New</option>
                <option value="used">Used</option>
              </select>
            </Field>
          </div>

          {/* Item */}
          <Field label="Item *">
            <input type="text" value={form.item} onChange={set('item')}
              placeholder="e.g. Dell Latitude 5520 Laptop"
              className={INPUT} style={IS} />
          </Field>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantity">
              <input type="number" min="0" step="0.01" value={form.quantity} onChange={set('quantity')}
                className={INPUT} style={IS} />
            </Field>
            <Field label="Unit">
              <input type="text" value={form.unit} onChange={set('unit')}
                placeholder="pcs, sets, box…"
                className={INPUT} style={IS} />
            </Field>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Delivered By">
              <input type="text" value={form.delivered_by} onChange={set('delivered_by')}
                placeholder="Supplier / courier name"
                className={INPUT} style={IS} />
            </Field>
            <Field label="Received By">
              <input type="text" value={form.received_by} onChange={set('received_by')}
                placeholder="Staff who received"
                className={INPUT} style={IS} />
            </Field>
          </div>

          {/* Storage */}
          <Field label="Temporary Building Storage">
            <input type="text" value={form.temporary_building_storage}
              onChange={set('temporary_building_storage')}
              placeholder="e.g. Building A – Storage Room 1"
              className={INPUT} style={IS} />
          </Field>

          {/* Transfer details */}
          <div className="pt-1">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--text-muted)' }}>Transfer Details</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Assigned / Transferred To">
                <input type="text" value={form.assigned_transferred_to}
                  onChange={set('assigned_transferred_to')}
                  placeholder="Person or department"
                  className={INPUT} style={IS} />
              </Field>
              <Field label="Transferred By">
                <input type="text" value={form.transferred_by} onChange={set('transferred_by')}
                  placeholder="Staff who transferred"
                  className={INPUT} style={IS} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Date Transferred">
                <input type="date" value={form.date_transferred} onChange={set('date_transferred')}
                  className={INPUT} style={IS} />
              </Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={14} />}
            {isEdit ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Move to IT Assets Modal ───────────────────────────────────
function MoveToITModal({
  item, onClose, onSuccess,
}: { item: ReceivedItem; onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false)

  const [transfer, setTransfer] = useState({
    assigned_transferred_to: item.assigned_transferred_to || '',
    transferred_by:          item.transferred_by          || '',
    date_transferred:        item.date_transferred        || new Date().toISOString().slice(0, 10),
  })

  // Map received item condition → asset condition
  const conditionMap: Record<string, string> = {
    new:         'excellent',
    good_as_new: 'good',
    recycle:     'fair',
    used:        'good',
  }

  const [assetForm, setAssetForm] = useState({
    name:          item.item,
    asset_code:    '',
    serial_number: '',
    category_id:   '',
    building_id:   '',
    floor_room:    item.temporary_building_storage || '',
    assigned_to:   item.assigned_transferred_to    || '',
    description:   '',
    condition:     conditionMap[item.condition] || 'good',
    purchase_date: '',
  })

  const { data: buildings = [] } = useQuery({ queryKey: ['buildings'], queryFn: buildingService.getAll })
  const { data: categories = [] } = useQuery({ queryKey: ['categories-it'], queryFn: () => categoryService.getByType('it') })

  const setT = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setTransfer(f => ({ ...f, [k]: e.target.value }))
  const setA = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setAssetForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    if (!assetForm.name.trim())                    { toast.error('Asset name is required'); return }
    if (!transfer.assigned_transferred_to.trim())  { toast.error('Assigned / Transferred To is required'); return }
    if (!transfer.date_transferred)                { toast.error('Date transferred is required'); return }
    setSaving(true)
    try {
      // 1. Create the IT asset
      const newAsset = await assetService.create({
        name:             assetForm.name,
        asset_code:       assetForm.asset_code    || null,
        serial_number:    assetForm.serial_number || null,
        category_id:      assetForm.category_id   || null,
        building_id:      assetForm.building_id   || null,
        floor_room:       assetForm.floor_room     || null,
        assigned_to:      assetForm.assigned_to    || null,
        description:      assetForm.description    || null,
        condition:        assetForm.condition,
        status:           'active',
        domain:           'it',
        purchase_date:    assetForm.purchase_date  || null,
        maintenance_date: null,
        image_url:        null,
      })

      // 2. Record the transfer on the received item and link asset
      await receivedItemService.transfer(item.id, {
        assigned_transferred_to: transfer.assigned_transferred_to,
        transferred_by:          transfer.transferred_by || '',
        date_transferred:        transfer.date_transferred,
        asset_id:                newAsset.id,
      })

      toast.success('Item moved to IT Assets!')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Failed to move item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
              <ArrowRightLeft size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Move to IT Assets</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.item}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">

          {/* Condition preview */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Item condition:</span>
            <ConditionBadge condition={item.condition} />
          </div>

          {/* IT Asset Details */}
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            IT Asset Details
          </p>
          <Field label="Asset Name *">
            <input type="text" value={assetForm.name} onChange={setA('name')}
              className={INPUT} style={IS} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Asset Code">
              <input type="text" value={assetForm.asset_code} onChange={setA('asset_code')}
                placeholder="AST-XXXXXX" className={INPUT} style={IS} />
            </Field>
            <Field label="Serial Number">
              <input type="text" value={assetForm.serial_number} onChange={setA('serial_number')}
                className={INPUT} style={IS} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select value={assetForm.category_id} onChange={setA('category_id')}
                className={INPUT} style={IS}>
                <option value="">Select category</option>
                {(categories as any[]).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Building">
              <select value={assetForm.building_id} onChange={setA('building_id')}
                className={INPUT} style={IS}>
                <option value="">Select building</option>
                {(buildings as any[]).map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Floor / Room">
              <input type="text" value={assetForm.floor_room} onChange={setA('floor_room')}
                className={INPUT} style={IS} />
            </Field>
            <Field label="Asset Condition">
              <select value={assetForm.condition} onChange={setA('condition')}
                className={INPUT} style={IS}>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Assigned To">
              <input type="text" value={assetForm.assigned_to} onChange={setA('assigned_to')}
                className={INPUT} style={IS} />
            </Field>
            <Field label="Purchase Date">
              <input type="date" value={assetForm.purchase_date} onChange={setA('purchase_date')}
                className={INPUT} style={IS} />
            </Field>
          </div>

          {/* Transfer details */}
          <p className="text-xs font-semibold uppercase tracking-wider pt-1" style={{ color: 'var(--text-muted)' }}>
            Transfer Record
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Assigned / Transferred To *">
              <input type="text" value={transfer.assigned_transferred_to} onChange={setT('assigned_transferred_to')}
                placeholder="Person or department" className={INPUT} style={IS} />
            </Field>
            <Field label="Transferred By">
              <input type="text" value={transfer.transferred_by} onChange={setT('transferred_by')}
                placeholder="Staff name" className={INPUT} style={IS} />
            </Field>
          </div>
          <Field label="Date Transferred *">
            <input type="date" value={transfer.date_transferred} onChange={setT('date_transferred')}
              className={INPUT} style={IS} />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 p-5"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRightLeft size={14} />}
            Move to IT Assets
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function ReceivedItemsPage() {
  const qc = useQueryClient()
  const { isAdmin, isITAdmin } = useAuth()
  const canEdit = isAdmin || isITAdmin

  const [search, setSearch]               = useState('')
  const [conditionFilter, setConditionFilter] = useState('')
  const [page, setPage]                   = useState(1)
  const PAGE_SIZE = 15

  const [showAdd, setShowAdd]             = useState(false)
  const [editItem, setEditItem]           = useState<ReceivedItem | null>(null)
  const [deleteItem, setDeleteItem]       = useState<ReceivedItem | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['received-items', search, conditionFilter, page],
    queryFn: () => receivedItemService.getAll(
      { condition: conditionFilter || undefined, search: search || undefined },
      page, PAGE_SIZE
    ),
    staleTime: 0,
  })

  const deleteMutation = useMutation({
    mutationFn: () => receivedItemService.delete(deleteItem!.id),
    onSuccess: () => {
      toast.success('Item deleted')
      setDeleteItem(null)
      qc.invalidateQueries({ queryKey: ['received-items'] })
    },
    onError: () => toast.error('Failed to delete'),
  })

  const items = data?.data || []
  const total = data?.count || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['received-items'] })
    qc.invalidateQueries({ queryKey: ['it-assets'] })
    qc.invalidateQueries({ queryKey: ['it-dashboard-stats'] })
  }

  const COLS = [
    'Date Received', 'Item', 'Qty / Unit', 'Condition',
    'Delivered By', 'Received By', 'Temp. Storage',
    'Assigned / Transferred To', 'Transferred By', 'Date Transferred', 'Actions'
  ]

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
              <PackageCheck size={16} className="text-white" />
            </div>
            <h1 className="page-title">Received Items</h1>
          </motion.div>
          <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
            className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Track incoming deliveries and move them to IT Assets
          </motion.p>
        </div>
        {canEdit && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus size={15} />
            Add Received Item
          </motion.button>
        )}
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by item name…"
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
        </div>
        <select value={conditionFilter} onChange={e => { setConditionFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
          <option value="">All Conditions</option>
          <option value="new">New</option>
          <option value="recycle">Recycle</option>
          <option value="good_as_new">Good as New</option>
          <option value="used">Used</option>
        </select>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 1100 }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.5)' }}>
                {COLS.map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={COLS.length} className="px-4 py-12 text-center">
                  <Loader2 size={20} className="animate-spin mx-auto" style={{ color: 'var(--text-muted)' }} />
                </td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={COLS.length} className="px-4 py-12 text-center">
                  <PackageCheck size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No received items found</p>
                </td></tr>
              ) : items.map((it, i) => (
                <motion.tr key={it.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="table-row-hover" style={{ borderTop: '1px solid var(--border-subtle)' }}>

                  {/* Date Received */}
                  <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                      {formatDate(it.date_received)}
                    </div>
                  </td>

                  {/* Item */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(6,182,212,0.1)' }}>
                        <Package size={13} style={{ color: '#06b6d4' }} />
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {it.item}
                      </span>
                    </div>
                    {it.asset && (
                      <a href={`/assets/${it.asset_id}`}
                        className="text-xs mt-0.5 flex items-center gap-1 hover:underline"
                        style={{ color: '#10b981' }}>
                        <Hash size={10} />{it.asset.asset_code || 'View IT Asset'} ↗
                      </a>
                    )}
                  </td>

                  {/* Qty/Unit */}
                  <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {it.quantity} {it.unit}
                  </td>

                  {/* Condition */}
                  <td className="px-4 py-3"><ConditionBadge condition={it.condition} /></td>

                  {/* Delivered By */}
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {it.delivered_by
                      ? <div className="flex items-center gap-1.5"><User size={12} style={{ color: 'var(--text-muted)' }} />{it.delivered_by}</div>
                      : '—'}
                  </td>

                  {/* Received By */}
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {it.received_by
                      ? <div className="flex items-center gap-1.5"><User size={12} style={{ color: 'var(--text-muted)' }} />{it.received_by}</div>
                      : '—'}
                  </td>

                  {/* Temp Storage */}
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {it.temporary_building_storage
                      ? <div className="flex items-center gap-1.5"><Building2 size={12} style={{ color: 'var(--text-muted)' }} />{it.temporary_building_storage}</div>
                      : '—'}
                  </td>

                  {/* Assigned/Transferred To */}
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {it.assigned_transferred_to || '—'}
                  </td>

                  {/* Transferred By */}
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {it.transferred_by || '—'}
                  </td>

                  {/* Date Transferred */}
                  <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {it.date_transferred ? formatDate(it.date_transferred) : '—'}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {canEdit && (
                        <button onClick={() => setEditItem(it)}
                          title="Edit"
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                          style={{ color: 'var(--text-muted)' }}>
                          <Pencil size={13} />
                        </button>
                      )}
                      {canEdit && (
                        <button onClick={() => setDeleteItem(it)}
                          title="Delete"
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-rose-500/10"
                          style={{ color: '#f43f5e' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {total} item{total !== 1 ? 's' : ''} · Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center btn-secondary disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-7 h-7 rounded-lg flex items-center justify-center btn-secondary disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      {showAdd && (
        <ReceivedItemModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); refresh() }}
        />
      )}
      {editItem && (
        <ReceivedItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSuccess={() => { setEditItem(null); refresh() }}
        />
      )}
      {deleteItem && (
        <DeleteConfirmModal
          title="Delete Received Item"
          message={`Are you sure you want to delete "${deleteItem.item}"? This cannot be undone.`}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setDeleteItem(null)}
        />
      )}
    </DashboardLayout>
  )
}