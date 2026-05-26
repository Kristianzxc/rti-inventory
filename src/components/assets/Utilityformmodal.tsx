import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Camera, Image as ImageIcon } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { assetService, categoryService, buildingService, utilityExtraService } from '@/services'
import { useAuthStore } from '@/store'
import { toast } from 'sonner'
import {
  UTILITY_CONDITION_OPTIONS,
  DESIGNATED_DEPARTMENT_OPTIONS,
  type Asset,
  type UtilityAssetExtra,
} from '@/types'

/* ─── WebP converter ──────────────────────────────────────────── */
async function toWebP(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1600
      let { width, height } = img
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height)
        width = Math.round(width * ratio); height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url)
        if (!blob) return reject(new Error('Conversion failed'))
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' }))
      }, 'image/webp', 0.88)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Load failed')) }
    img.src = url
  })
}

/* ─── Props ───────────────────────────────────────────────────── */
interface Props {
  asset?: Asset | null
  onClose: () => void
  onSuccess: () => void
}

type TabKey = 'details' | 'damage' | 'repair'

/* ─── Condition badge helper ──────────────────────────────────── */
function conditionColor(c: string) {
  const map: Record<string, { bg: string; color: string }> = {
    'Working - Assigned':  { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
    'Working - In Storage':{ bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
    'For Testing':         { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
    'Not Tested':          { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
    'Defective':           { bg: 'rgba(249,115,22,0.15)',  color: '#f97316' },
    'Damaged':             { bg: 'rgba(244,63,94,0.15)',   color: '#f43f5e' },
    'For Disposal':        { bg: 'rgba(127,29,29,0.25)',   color: '#fca5a5' },
  }
  return map[c] || { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' }
}

export default function UtilityFormModal({ asset, onClose, onSuccess }: Props) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const isEdit = !!asset
  const cameraRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<TabKey>('details')
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(asset?.image_url || '')

  /* ── Fetch supporting data ── */
  const { data: categories = [] } = useQuery({
    queryKey: ['categories-modal', 'utility'],
    queryFn: () => categoryService.getByType('utility'),
    staleTime: 0,
  })
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingService.getAll(),
    staleTime: 0,
  })
  const { data: existingExtra } = useQuery<UtilityAssetExtra | null>({
    queryKey: ['utility-extra', asset?.id],
    queryFn: () => utilityExtraService.getByAssetId(asset!.id),
    enabled: isEdit && !!asset?.id,
    staleTime: 0,
  })

  /* ── Asset form state ── */
  const [form, setForm] = useState({
    name:           asset?.name           || '',
    asset_code:     asset?.asset_code     || '',
    category_id:    asset?.category_id    || '',
    building_id:    asset?.building_id    || '',
    serial_number:  asset?.serial_number  || '',
    assigned_to:    asset?.assigned_to    || '',
    description:    asset?.description    || '',
    purchase_date:  asset?.purchase_date  || '',
  })

  /* ── Utility extra state ── */
  const [extra, setExtra] = useState({
    workstation:                  existingExtra?.workstation                  || '',
    designated_department:        existingExtra?.designated_department        || '',
    date_of_use:                  existingExtra?.date_of_use                  || '',
    age_span:                     existingExtra?.age_span                     || '',
    utility_condition:            existingExtra?.utility_condition            || '',
    direct_responsible_individual:existingExtra?.direct_responsible_individual|| '',
    note:                         existingExtra?.note                         || '',
  })

  /* ── Damage report state ── */
  const [damage, setDamage] = useState({
    damage_date_reported:  existingExtra?.damage_date_reported  || '',
    damage_reported_by:    existingExtra?.damage_reported_by    || '',
    damage_description:    existingExtra?.damage_description    || '',
    damage_recommendation: existingExtra?.damage_recommendation || '',
  })

  /* ── Repair state ── */
  const [repair, setRepair] = useState({
    repair_date:    existingExtra?.repair_date    || '',
    repair_details: existingExtra?.repair_details || '',
    repair_remarks: existingExtra?.repair_remarks || '',
  })

  /* ── Image handling ── */
  const processImage = async (file: File) => {
    try {
      const webp = await toWebP(file)
      setImageFile(webp)
      setImagePreview(URL.createObjectURL(webp))
    } catch { toast.error('Failed to process image') }
  }
  const onDrop = useCallback((files: File[]) => { if (files[0]) processImage(files[0]) }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1, maxSize: 20 * 1024 * 1024,
  })

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Item Model is required'); return }
    if (!form.asset_code.trim()) { toast.error('Stock ID is required'); return }
    if (!form.category_id) { toast.error('Item Type is required'); return }
    if (!form.building_id) { toast.error('Building is required'); return }

    setLoading(true)
    try {
      const assetPayload = {
        ...form,
        domain: 'utility',
        purchase_date: form.purchase_date || null,
        maintenance_date: null,
      }

      let savedAsset: Asset
      if (isEdit) {
        savedAsset = await assetService.update(asset!.id, assetPayload, imageFile)
        toast.success('Item updated')
      } else {
        savedAsset = await assetService.create(assetPayload, user?.id || '', imageFile)
        toast.success('Item added')
      }

      // Save extra fields
      await utilityExtraService.upsert(savedAsset.id, {
        ...extra,
        ...damage,
        ...repair,
        date_of_use: extra.date_of_use || null,
      })

      await qc.invalidateQueries({ queryKey: ['utility-assets'] })
      await qc.invalidateQueries({ queryKey: ['utility-extra', asset?.id] })
      onSuccess()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save item')
    } finally {
      setLoading(false)
    }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'details', label: 'Item Details' },
    ...(isEdit ? [
      { key: 'damage' as TabKey, label: 'Damage / Incident' },
      { key: 'repair' as TabKey, label: 'Repair' },
    ] : []),
  ]

  const F = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="label-text block mb-1.5">
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  )

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 modal-overlay"
        onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="w-full md:max-w-2xl glass-card flex flex-col"
          style={{ maxHeight: '92vh', borderRadius: 'clamp(0px, 16px, 16px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>U</div>
              <h2 className="section-title">{isEdit ? 'Edit Utility Item' : 'Add Utility Item'}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10"
              style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
          </div>

          {/* Tabs — edit only shows damage/repair tabs */}
          {isEdit && (
            <div className="flex gap-1 px-6 pt-3 shrink-0">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: activeTab === t.key ? 'rgba(16,185,129,0.15)' : 'transparent',
                    color: activeTab === t.key ? '#10b981' : 'var(--text-muted)',
                    border: activeTab === t.key ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Body */}
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
            <div className="px-6 py-4 space-y-4">

              {/* ── DETAILS TAB ── */}
              {activeTab === 'details' && (
                <>
                  {/* Image */}
                  <F label="Item Image">
                    {imagePreview ? (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden">
                        <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: 'rgba(0,0,0,0.6)', color: '#10b981' }}>.webp ✓</span>
                          <button type="button" onClick={() => { setImagePreview(''); setImageFile(null) }}
                            className="w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(0,0,0,0.6)' }}>
                            <X size={13} className="text-white" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors
                          ${isDragActive ? 'border-emerald-400 bg-emerald-400/5' : 'border-slate-700 hover:border-slate-500'}`}>
                          <input {...getInputProps()} />
                          <Upload size={22} className="mx-auto mb-1" style={{ color: 'var(--text-muted)' }} />
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {isDragActive ? 'Drop to upload' : 'Tap to choose from gallery'}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Auto-converted to .webp</p>
                        </div>
                        <button type="button" onClick={() => cameraRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium"
                          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>
                          <Camera size={15} /> Take Photo
                        </button>
                        <input ref={cameraRef} type="file" accept="image/*" capture="environment"
                          className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) await processImage(f); e.target.value = '' }} />
                      </div>
                    )}
                  </F>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <F label="Item Model" required>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="input-field" placeholder="e.g. Executive Chair Model X" />
                    </F>
                    <F label="Stock ID" required>
                      <input value={form.asset_code} onChange={e => setForm(f => ({ ...f, asset_code: e.target.value }))}
                        className="input-field font-mono" placeholder="e.g. UTL-001" />
                    </F>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <F label="Item Type (Category)" required>
                      <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                        className="select-field">
                        <option value="">Select item type...</option>
                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </F>
                    <F label="Bldg / Room" required>
                      <select value={form.building_id} onChange={e => setForm(f => ({ ...f, building_id: e.target.value }))}
                        className="select-field">
                        <option value="">Select building...</option>
                        {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </F>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <F label="Serial Number">
                      <input value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))}
                        className="input-field" placeholder="e.g. SN123456" />
                    </F>
                    <F label="Location of Item">
                      <input value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                        className="input-field" placeholder="e.g. Room 201 / Storage A" />
                    </F>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <F label="Workstation">
                      <input value={extra.workstation} onChange={e => setExtra(x => ({ ...x, workstation: e.target.value }))}
                        className="input-field" placeholder="e.g. WS-01" />
                    </F>
                    <F label="Designated Department">
                      <select value={extra.designated_department} onChange={e => setExtra(x => ({ ...x, designated_department: e.target.value }))}
                        className="select-field">
                        <option value="">Select department...</option>
                        {DESIGNATED_DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </F>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <F label="Date of Use">
                      <input type="date" value={extra.date_of_use} onChange={e => setExtra(x => ({ ...x, date_of_use: e.target.value }))}
                        className="input-field" />
                    </F>
                    <F label="Age Span">
                      <input value={extra.age_span} onChange={e => setExtra(x => ({ ...x, age_span: e.target.value }))}
                        className="input-field" placeholder="e.g. 2 years" />
                    </F>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <F label="Condition" required>
                      <select value={extra.utility_condition} onChange={e => setExtra(x => ({ ...x, utility_condition: e.target.value }))}
                        className="select-field">
                        <option value="">Select condition...</option>
                        {UTILITY_CONDITION_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {extra.utility_condition && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1.5"
                          style={conditionColor(extra.utility_condition)}>
                          {extra.utility_condition}
                        </span>
                      )}
                    </F>
                    <F label="Purchase Date">
                      <input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
                        className="input-field" />
                    </F>
                  </div>

                  <F label="Direct Responsible Individual">
                    <input value={extra.direct_responsible_individual}
                      onChange={e => setExtra(x => ({ ...x, direct_responsible_individual: e.target.value }))}
                      className="input-field" placeholder="Full name of responsible person" />
                  </F>

                  <F label="Item Description">
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="input-field resize-none" rows={2} placeholder="Optional description..." />
                  </F>

                  <F label="Note">
                    <textarea value={extra.note} onChange={e => setExtra(x => ({ ...x, note: e.target.value }))}
                      className="input-field resize-none" rows={2} placeholder="Additional notes..." />
                  </F>
                </>
              )}

              {/* ── DAMAGE / INCIDENT TAB (edit only) ── */}
              {activeTab === 'damage' && isEdit && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl text-sm"
                    style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#fda4af' }}>
                    Record damage or incident details for this item.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <F label="Date Reported">
                      <input type="date" value={damage.damage_date_reported}
                        onChange={e => setDamage(d => ({ ...d, damage_date_reported: e.target.value }))}
                        className="input-field" />
                    </F>
                    <F label="Reported By">
                      <input value={damage.damage_reported_by}
                        onChange={e => setDamage(d => ({ ...d, damage_reported_by: e.target.value }))}
                        className="input-field" placeholder="Full name" />
                    </F>
                  </div>
                  <F label="Description of Damage">
                    <textarea value={damage.damage_description}
                      onChange={e => setDamage(d => ({ ...d, damage_description: e.target.value }))}
                      className="input-field resize-none" rows={3} placeholder="Describe the damage or incident..." />
                  </F>
                  <F label="Recommendation">
                    <textarea value={damage.damage_recommendation}
                      onChange={e => setDamage(d => ({ ...d, damage_recommendation: e.target.value }))}
                      className="input-field resize-none" rows={3} placeholder="Recommended action..." />
                  </F>
                </div>
              )}

              {/* ── REPAIR TAB (edit only) ── */}
              {activeTab === 'repair' && isEdit && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl text-sm"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
                    Log repair work performed on this item.
                  </div>
                  <F label="Date of Repair">
                    <input type="date" value={repair.repair_date}
                      onChange={e => setRepair(r => ({ ...r, repair_date: e.target.value }))}
                      className="input-field" />
                  </F>
                  <F label="Details">
                    <textarea value={repair.repair_details}
                      onChange={e => setRepair(r => ({ ...r, repair_details: e.target.value }))}
                      className="input-field resize-none" rows={3} placeholder="Work performed..." />
                  </F>
                  <F label="Remarks">
                    <textarea value={repair.repair_remarks}
                      onChange={e => setRepair(r => ({ ...r, repair_remarks: e.target.value }))}
                      className="input-field resize-none" rows={3} placeholder="Additional remarks..." />
                  </F>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center justify-end gap-3 shrink-0"
              style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary"
                style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : activeTab === 'details'
                    ? isEdit ? 'Update Item' : 'Add Item'
                    : 'Save Changes'
                }
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}