import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, QrCode, Pencil, Trash2,
  MapPin, Tag, User, Calendar, Wrench,
  Hash, AlertCircle, Download, Plus, X,
  AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react'
import QRCode from 'qrcode'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { assetService, utilityExtraService, incidentService, repairService } from '@/services'
import { formatDate, getStatusColor, getConditionBadge } from '@/utils'
import { useAuth } from '@/features/auth/AuthContext'
import AssetFormModal from '@/components/assets/AssetFormModal'
import UtilityFormModal from '@/components/assets/Utilityformmodal'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'
import { toast } from 'sonner'
import type { UtilityAssetExtra } from '@/types'

/* ─── Utility condition badge ─────────────────────────────────── */
function UtilityConditionBadge({ value }: { value: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'Working - Assigned':   { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
    'Working - In Storage': { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
    'For Testing':          { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
    'Not Tested':           { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
    'Defective':            { bg: 'rgba(249,115,22,0.15)',  color: '#f97316' },
    'Damaged':              { bg: 'rgba(244,63,94,0.15)',   color: '#f43f5e' },
    'For Disposal':         { bg: 'rgba(127,29,29,0.25)',   color: '#fca5a5' },
  }
  const s = map[value] || { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' }
  if (!value) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={s}>
      {value}
    </span>
  )
}

/* ─── Timeline entry ──────────────────────────────────────────── */
function TimelineEntry({ color, date, title, children, onDelete, canEdit }: {
  color: string; date?: string; title: string; children: React.ReactNode
  onDelete?: () => void; canEdit: boolean
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
        <div className="flex-1 w-px mt-1" style={{ background: 'var(--border-subtle)' }} />
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
            {date && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{date}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setOpen(o => !o)}
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ color: 'var(--text-muted)' }}>
              {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {canEdit && onDelete && (
              <button onClick={onDelete}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-rose-500/20 text-rose-400">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
              className="mt-2 rounded-xl p-3 space-y-2"
              style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ─── Add Log Form ────────────────────────────────────────────── */
function AddIncidentForm({ assetId, onSaved }: { assetId: string; onSaved: () => void }) {
  const [form, setForm] = useState({ date_reported: '', reported_by: '', description: '', recommendation: '' })
  const [saving, setSaving] = useState(false)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim()) { toast.error('Description is required'); return }
    setSaving(true)
    try {
      await incidentService.create({ asset_id: assetId, ...form, date_reported: form.date_reported || null })
      toast.success('Incident logged')
      onSaved()
      setForm({ date_reported: '', reported_by: '', description: '', recommendation: '' })
    } catch (err: any) { toast.error(err.message || 'Failed to save') }
    finally { setSaving(false) }
  }
  return (
    <form onSubmit={handleSave} className="space-y-3 p-4 rounded-xl"
      style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.2)' }}>
      <p className="text-sm font-semibold" style={{ color: '#f43f5e' }}>New Incident Report</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-text block mb-1 text-xs">Date Reported</label>
          <input type="date" value={form.date_reported} onChange={e => setForm(f => ({ ...f, date_reported: e.target.value }))} className="input-field text-sm py-1.5" />
        </div>
        <div>
          <label className="label-text block mb-1 text-xs">Reported By</label>
          <input value={form.reported_by} onChange={e => setForm(f => ({ ...f, reported_by: e.target.value }))} className="input-field text-sm py-1.5" placeholder="Full name" />
        </div>
      </div>
      <div>
        <label className="label-text block mb-1 text-xs">Description of Damage <span className="text-rose-400">*</span></label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="input-field resize-none text-sm" rows={2} placeholder="Describe the damage or incident..." />
      </div>
      <div>
        <label className="label-text block mb-1 text-xs">Recommendation</label>
        <textarea value={form.recommendation} onChange={e => setForm(f => ({ ...f, recommendation: e.target.value }))}
          className="input-field resize-none text-sm" rows={2} placeholder="Recommended action..." />
      </div>
      <div className="flex justify-end gap-2">
        <button type="submit" disabled={saving} className="btn-primary text-sm py-1.5 px-3"
          style={{ background: 'linear-gradient(135deg,#f43f5e,#f97316)' }}>
          {saving ? 'Saving...' : 'Log Incident'}
        </button>
      </div>
    </form>
  )
}

function AddRepairForm({ assetId, onSaved }: { assetId: string; onSaved: () => void }) {
  const [form, setForm] = useState({ date_of_repair: '', details: '', remarks: '' })
  const [saving, setSaving] = useState(false)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.details.trim()) { toast.error('Details are required'); return }
    setSaving(true)
    try {
      await repairService.create({ asset_id: assetId, ...form, date_of_repair: form.date_of_repair || null })
      toast.success('Repair logged')
      onSaved()
      setForm({ date_of_repair: '', details: '', remarks: '' })
    } catch (err: any) { toast.error(err.message || 'Failed to save') }
    finally { setSaving(false) }
  }
  return (
    <form onSubmit={handleSave} className="space-y-3 p-4 rounded-xl"
      style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
      <p className="text-sm font-semibold" style={{ color: '#10b981' }}>New Repair Record</p>
      <div>
        <label className="label-text block mb-1 text-xs">Date of Repair</label>
        <input type="date" value={form.date_of_repair} onChange={e => setForm(f => ({ ...f, date_of_repair: e.target.value }))} className="input-field text-sm py-1.5" />
      </div>
      <div>
        <label className="label-text block mb-1 text-xs">Details <span className="text-rose-400">*</span></label>
        <textarea value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
          className="input-field resize-none text-sm" rows={2} placeholder="Work performed..." />
      </div>
      <div>
        <label className="label-text block mb-1 text-xs">Remarks</label>
        <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
          className="input-field resize-none text-sm" rows={2} placeholder="Additional remarks..." />
      </div>
      <div className="flex justify-end gap-2">
        <button type="submit" disabled={saving} className="btn-primary text-sm py-1.5 px-3"
          style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
          {saving ? 'Saving...' : 'Log Repair'}
        </button>
      </div>
    </form>
  )
}

/* ─── Main page ───────────────────────────────────────────────── */
export default function AssetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isAdmin, isUtility, isITAdmin } = useAuth()
  const canEdit = isAdmin || isITAdmin || isUtility
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [showIncidentForm, setShowIncidentForm] = useState(false)
  const [showRepairForm, setShowRepairForm] = useState(false)

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetService.getById(id!),
    enabled: !!id,
    staleTime: 0,
  })

  const { data: utilityExtra } = useQuery<UtilityAssetExtra | null>({
    queryKey: ['utility-extra', id],
    queryFn: () => utilityExtraService.getByAssetId(id!),
    enabled: !!id && asset?.domain === 'utility',
    staleTime: 0,
  })

  const { data: incidents = [], refetch: refetchIncidents } = useQuery({
    queryKey: ['incidents', id],
    queryFn: () => incidentService.getByAssetId(id!),
    enabled: !!id && asset?.domain === 'utility',
    staleTime: 0,
  })

  const { data: repairs = [], refetch: refetchRepairs } = useQuery({
    queryKey: ['repairs', id],
    queryFn: () => repairService.getByAssetId(id!),
    enabled: !!id && asset?.domain === 'utility',
    staleTime: 0,
  })

  const handleGenerateQR = async () => {
    if (!asset) return
    const scanUrl = `${window.location.origin}/scan/${asset.id}`
    const url = await QRCode.toDataURL(scanUrl, { width: 300, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } })
    setQrDataUrl(url)
  }

  const handleDownloadQR = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `${asset?.asset_code || 'asset'}-qr.png`
    a.click()
  }

  const handleDelete = async () => {
    if (!asset) return
    try {
      await assetService.delete(asset.id)
      toast.success('Asset deleted')
      navigate(asset.domain === 'utility' ? '/utility-assets' : '/assets')
    } catch { toast.error('Failed to delete asset') }
  }

  const deleteIncident = async (incId: string) => {
    try { await incidentService.delete(incId); refetchIncidents(); toast.success('Incident removed') }
    catch { toast.error('Failed to delete') }
  }

  const deleteRepair = async (repId: string) => {
    try { await repairService.delete(repId); refetchRepairs(); toast.success('Repair removed') }
    catch { toast.error('Failed to delete') }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 w-full rounded-2xl" />)}
        </div>
      </DashboardLayout>
    )
  }

  if (!asset) {
    return (
      <DashboardLayout>
        <div className="glass-card p-12 text-center">
          <AlertCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Asset not found.</p>
          <button onClick={() => navigate(-1)} className="btn-secondary mt-4">← Go Back</button>
        </div>
      </DashboardLayout>
    )
  }

  const isUtilityAsset = asset.domain === 'utility'
  const backPath = isUtilityAsset ? '/utility-assets' : '/assets'

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(backPath)} className="btn-secondary py-2 px-3 text-sm">
          <ArrowLeft size={15} />
          {isUtilityAsset ? 'Back to Utility Assets' : 'Back to IT Assets'}
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleGenerateQR} className="btn-secondary">
            <QrCode size={15} /> Generate QR
          </button>
          {canEdit && (
            <>
              <button onClick={() => setShowEdit(true)} className="btn-secondary">
                <Pencil size={15} /> Edit
              </button>
              <button onClick={() => setShowDelete(true)} className="btn-danger">
                <Trash2 size={15} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* Header card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="flex items-start gap-5">
              {asset.image_url ? (
                <img src={asset.image_url} alt={asset.name} className="w-24 h-24 rounded-2xl object-cover shrink-0" />
              ) : (
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center shrink-0 text-3xl font-bold"
                  style={{ background: isUtilityAsset ? 'rgba(16,185,129,0.15)' : 'rgba(6,182,212,0.15)', color: isUtilityAsset ? '#10b981' : '#06b6d4' }}>
                  {asset.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {isUtilityAsset
                    ? <UtilityConditionBadge value={utilityExtra?.utility_condition || ''} />
                    : <>
                        <span className={getStatusColor(asset.status)} style={{ textTransform: 'capitalize' }}>{asset.status}</span>
                        <span className={`badge ${getConditionBadge(asset.condition)}`} style={{ textTransform: 'capitalize' }}>{asset.condition}</span>
                      </>
                  }
                </div>
                <h1 className="page-title mb-1">{asset.name}</h1>
                <div className="flex items-center gap-1.5 mb-1">
                  <Hash size={13} style={{ color: 'var(--text-muted)' }} />
                  <code className="text-sm font-mono" style={{ color: 'var(--accent-blue)' }}>
                    {isUtilityAsset ? (asset.asset_code || '—') : (asset.asset_code || '—')}
                  </code>
                  {isUtilityAsset && <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>(Stock ID)</span>}
                </div>
                {asset.description && (
                  <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{asset.description}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-6">
            <h2 className="section-title mb-5">{isUtilityAsset ? 'Item Details' : 'Asset Details'}</h2>

            {/* IT fields */}
            {!isUtilityAsset && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { icon: Tag,      label: 'Category',         value: asset.category?.name },
                  { icon: MapPin,   label: 'Building',         value: asset.building?.name },
                  { icon: Hash,     label: 'Serial Number',    value: asset.serial_number },
                  { icon: User,     label: 'Assigned To',      value: asset.assigned_to },
                  { icon: Calendar, label: 'Purchase Date',    value: formatDate(asset.purchase_date) },
                  { icon: Wrench,   label: 'Next Maintenance', value: formatDate(asset.maintenance_date) },
                  { icon: Calendar, label: 'Added On',         value: formatDate(asset.created_at) },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'var(--bg-tertiary)' }}>
                      <item.icon size={15} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                      <p className="text-sm font-medium mt-0.5" style={{ color: item.value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {item.value || '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Utility fields */}
            {isUtilityAsset && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Item Type',                     value: asset.category?.name },
                    { label: 'Bldg / Room',                   value: asset.building?.name },
                    { label: 'Stock ID',                      value: asset.asset_code },
                    { label: 'Serial Number',                 value: asset.serial_number },
                    { label: 'Location of Item',              value: asset.assigned_to },
                    { label: 'Purchase Date',                 value: formatDate(asset.purchase_date) },
                    { label: 'Added On',                      value: formatDate(asset.created_at) },
                    { label: 'Age Span',                      value: utilityExtra?.age_span },
                    { label: 'Date of Use',                   value: formatDate(utilityExtra?.date_of_use) },
                    { label: 'Workstation',                   value: utilityExtra?.workstation },
                    { label: 'Designated Department',         value: utilityExtra?.designated_department },
                    { label: 'Direct Responsible Individual', value: utilityExtra?.direct_responsible_individual },
                  ].map((item, i) => (
                    <div key={i}>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                      <p className="text-sm font-medium" style={{ color: item.value ? 'var(--text-primary)' : 'var(--text-muted)' }}>{item.value || '—'}</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Condition</p>
                    <UtilityConditionBadge value={utilityExtra?.utility_condition || ''} />
                  </div>
                </div>
                {(asset.description || utilityExtra?.note) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    {asset.description && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Item Description</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{asset.description}</p>
                      </div>
                    )}
                    {utilityExtra?.note && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Note</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{utilityExtra.note}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* ── Incident + Repair History (utility only) ── */}
          {isUtilityAsset && (
            <>
              {/* Incident History */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="glass-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} style={{ color: '#f43f5e' }} />
                    <h2 className="section-title">Damage / Incident History</h2>
                    {incidents.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}>
                        {incidents.length}
                      </span>
                    )}
                  </div>
                  {canEdit && (
                    <button onClick={() => setShowIncidentForm(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.25)' }}>
                      {showIncidentForm ? <X size={13} /> : <Plus size={13} />}
                      {showIncidentForm ? 'Cancel' : 'Log Incident'}
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showIncidentForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="mb-5">
                      <AddIncidentForm assetId={asset.id} onSaved={() => { refetchIncidents(); setShowIncidentForm(false) }} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {incidents.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No incident reports yet.</p>
                ) : (
                  <div className="mt-1">
                    {incidents.map((inc: any, i: number) => (
                      <TimelineEntry key={inc.id} color="#f43f5e"
                        date={inc.date_reported ? formatDate(inc.date_reported) : undefined}
                        title={`Incident #${incidents.length - i}`}
                        canEdit={canEdit}
                        onDelete={() => deleteIncident(inc.id)}>
                        {inc.reported_by && (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Reported by: </span>{inc.reported_by}
                          </p>
                        )}
                        {inc.description && (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Damage: </span>{inc.description}
                          </p>
                        )}
                        {inc.recommendation && (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Recommendation: </span>{inc.recommendation}
                          </p>
                        )}
                      </TimelineEntry>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Repair History */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="glass-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Wrench size={16} style={{ color: '#10b981' }} />
                    <h2 className="section-title">Repair History</h2>
                    {repairs.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                        {repairs.length}
                      </span>
                    )}
                  </div>
                  {canEdit && (
                    <button onClick={() => setShowRepairForm(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                      {showRepairForm ? <X size={13} /> : <Plus size={13} />}
                      {showRepairForm ? 'Cancel' : 'Log Repair'}
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showRepairForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="mb-5">
                      <AddRepairForm assetId={asset.id} onSaved={() => { refetchRepairs(); setShowRepairForm(false) }} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {repairs.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No repair records yet.</p>
                ) : (
                  <div className="mt-1">
                    {repairs.map((rep: any, i: number) => (
                      <TimelineEntry key={rep.id} color="#10b981"
                        date={rep.date_of_repair ? formatDate(rep.date_of_repair) : undefined}
                        title={`Repair #${repairs.length - i}`}
                        canEdit={canEdit}
                        onDelete={() => deleteRepair(rep.id)}>
                        {rep.details && (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Details: </span>{rep.details}
                          </p>
                        )}
                        {rep.remarks && (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Remarks: </span>{rep.remarks}
                          </p>
                        )}
                      </TimelineEntry>
                    ))}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <QrCode size={16} style={{ color: 'var(--accent-blue)' }} />
              <h3 className="section-title text-base">QR Code</h3>
            </div>
            {qrDataUrl ? (
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-xl bg-white">
                  <img src={qrDataUrl} alt="QR Code" className="w-full max-w-[180px]" />
                </div>
                <div className="flex gap-2 w-full">
                  <button onClick={handleDownloadQR} className="btn-secondary flex-1 justify-center text-xs py-2">
                    <Download size={13} /> Download
                  </button>
                  <button onClick={handleGenerateQR} className="btn-secondary flex-1 justify-center text-xs py-2">
                    Regenerate
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
                  <QrCode size={28} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>Generate a QR code for this asset</p>
                <button onClick={handleGenerateQR} className="btn-primary w-full justify-center text-sm py-2">
                  Generate QR Code
                </button>
              </div>
            )}
          </motion.div>

          {/* Maintenance alert for IT assets */}
          {!isUtilityAsset && asset.maintenance_date && new Date(asset.maintenance_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="glass-card p-4 border border-amber-500/30" style={{ background: 'rgba(245,158,11,0.08)' }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={15} className="text-amber-400" />
                <p className="text-sm font-medium text-amber-400">Maintenance Due Soon</p>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Scheduled for {formatDate(asset.maintenance_date)}
              </p>
            </motion.div>
          )}

          {/* Utility quick stats */}
          {isUtilityAsset && (incidents.length > 0 || repairs.length > 0) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="glass-card p-5">
              <h3 className="section-title text-base mb-4">Activity Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Incidents</span>
                  <span className="text-lg font-bold" style={{ color: '#f43f5e', fontFamily: 'Barlow, sans-serif' }}>{incidents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Repairs</span>
                  <span className="text-lg font-bold" style={{ color: '#10b981', fontFamily: 'Barlow, sans-serif' }}>{repairs.length}</span>
                </div>
                {incidents.length > 0 && incidents[0]?.date_reported && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Last Incident</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(incidents[0].date_reported)}</span>
                  </div>
                )}
                {repairs.length > 0 && repairs[0]?.date_of_repair && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Last Repair</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(repairs[0].date_of_repair)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {showEdit && asset.domain === 'utility' && (
        <UtilityFormModal asset={asset as any} onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); qc.invalidateQueries({ queryKey: ['asset', id] }); qc.invalidateQueries({ queryKey: ['utility-extra', id] }) }} />
      )}
      {showEdit && asset.domain !== 'utility' && (
        <AssetFormModal asset={asset as any} domain={asset.domain}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); qc.invalidateQueries({ queryKey: ['asset', id] }) }}
          buildings={[]} categories={[]} />
      )}
      {showDelete && (
        <DeleteConfirmModal title="Delete Asset"
          message={`Delete "${asset.name}"? This cannot be undone.`}
          onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      )}
    </DashboardLayout>
  )
}