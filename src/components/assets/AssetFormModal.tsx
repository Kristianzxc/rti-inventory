import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { assetService } from '@/services'
import { useAuthStore } from '@/store'
import { toast } from 'sonner'
import type { Asset, Building, AssetCategory, AssetDomain } from '@/types'
import { ASSET_STATUS_OPTIONS, ASSET_CONDITION_OPTIONS } from '@/utils'

const assetSchema = z.object({
  name:             z.string().min(2, 'Name is required'),
  description:      z.string().optional(),
  category_id:      z.string().min(1, 'Category is required'),
  building_id:      z.string().min(1, 'Building is required'),
  asset_code:       z.string().min(1, 'Asset code is required'),
  serial_number:    z.string().optional(),
  status:           z.enum(['active','inactive','maintenance','retired']),
  condition:        z.enum(['excellent','good','fair','poor']),
  assigned_to:      z.string().optional(),
  purchase_date:    z.string().optional(),
  maintenance_date: z.string().optional(),
})
type FormValues = z.infer<typeof assetSchema>

interface AssetFormModalProps {
  asset?:      Asset | null
  domain:      AssetDomain      // 'it' | 'utility' — enforced on submit
  onClose:     () => void
  onSuccess:   () => void
  buildings:   Building[]
  categories:  AssetCategory[]  // already filtered to the correct domain
}

export default function AssetFormModal({ asset, domain, onClose, onSuccess, buildings, categories }: AssetFormModalProps) {
  const { user } = useAuthStore()
  const [loading, setLoading]       = useState(false)
  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(asset?.image_url || '')
  const isEdit = !!asset

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name:             asset?.name             || '',
      description:      asset?.description      || '',
      category_id:      asset?.category_id      || '',
      building_id:      asset?.building_id      || '',
      asset_code:       asset?.asset_code       || '',
      serial_number:    asset?.serial_number    || '',
      status:           asset?.status           || 'active',
      condition:        asset?.condition        || 'good',
      assigned_to:      asset?.assigned_to      || '',
      purchase_date:    asset?.purchase_date    || '',
      maintenance_date: asset?.maintenance_date || '',
    },
  })

  const onDrop = useCallback((files: File[]) => {
    const f = files[0]
    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg','.jpeg','.png','.webp'] }, maxFiles: 1, maxSize: 5*1024*1024,
  })

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      if (isEdit) {
        await assetService.update(asset!.id, { ...data, domain } as any, imageFile)
        toast.success('Asset updated')
      } else {
        await assetService.create({ ...data, domain } as any, user?.id || '', imageFile)
        toast.success('Asset added')
      }
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save asset')
    } finally {
      setLoading(false)
    }
  }

  const domainColor = domain === 'it'
    ? 'linear-gradient(135deg,#06b6d4,#3b82f6)'
    : 'linear-gradient(135deg,#10b981,#06b6d4)'
  const domainLabel = domain === 'it' ? 'IT' : 'Utility'

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl glass-card overflow-hidden"
          style={{ maxHeight: '90vh', overflowY: 'auto' }}>

          {/* Header */}
          <div className="flex items-center justify-between p-6" style={{ borderBottom:'1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ background: domainColor }}>{domainLabel[0]}</div>
              <h2 className="section-title">{isEdit ? `Edit ${domainLabel} Asset` : `Add ${domainLabel} Asset`}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10"
              style={{ color: 'var(--text-muted)' }}><X size={16}/></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            {/* Image */}
            <div>
              <label className="label-text block mb-2">Asset Image</label>
              {imagePreview ? (
                <div className="relative w-full h-40 rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setImagePreview(''); setImageFile(null) }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.6)' }}><X size={13} className="text-white"/></button>
                </div>
              ) : (
                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-blue-400 bg-blue-400/5' : 'border-slate-700 hover:border-slate-600'}`}>
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-2">
                    {isDragActive ? <ImageIcon size={28} className="text-blue-400"/> : <Upload size={28} style={{ color:'var(--text-muted)' }}/>}
                    <p className="text-sm" style={{ color:'var(--text-secondary)' }}>
                      {isDragActive ? 'Drop the image here' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-xs" style={{ color:'var(--text-muted)' }}>PNG, JPG, WebP — max 5MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Name + serial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-1.5">Asset Name <span className="text-rose-400">*</span></label>
                <input {...register('name')} className="input-field" placeholder={domain === 'it' ? 'e.g. Dell Latitude 5520' : 'e.g. Executive Chair'} />
                {errors.name && <p className="text-xs mt-1 text-rose-400">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label-text block mb-1.5">Serial Number</label>
                <input {...register('serial_number')} className="input-field" placeholder="e.g. SN123456789" />
              </div>
            </div>

            {/* Category + Building */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-1.5">
                  {domainLabel} Category <span className="text-rose-400">*</span>
                </label>
                <select {...register('category_id')} className="select-field">
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.category_id && <p className="text-xs mt-1 text-rose-400">{errors.category_id.message}</p>}
              </div>
              <div>
                <label className="label-text block mb-1.5">Building <span className="text-rose-400">*</span></label>
                <select {...register('building_id')} className="select-field">
                  <option value="">Select building...</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.building_id && <p className="text-xs mt-1 text-rose-400">{errors.building_id.message}</p>}
              </div>
            </div>

            <div>
              <label className="label-text block mb-1.5">Asset Code <span className="text-rose-400">*</span></label>
              <input {...register('asset_code')} className="input-field font-mono" placeholder="e.g. IT-001, AST-2024-001" />
              {errors.asset_code && <p className="text-xs mt-1 text-rose-400">{errors.asset_code.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-1.5">Status <span className="text-rose-400">*</span></label>
                <select {...register('status')} className="select-field">
                  {ASSET_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text block mb-1.5">Condition <span className="text-rose-400">*</span></label>
                <select {...register('condition')} className="select-field">
                  {ASSET_CONDITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-1.5">Assigned To</label>
                <input {...register('assigned_to')} className="input-field" placeholder="e.g. John Doe / IT Department" />
              </div>
              <div>
                <label className="label-text block mb-1.5">Purchase Date</label>
                <input {...register('purchase_date')} type="date" className="input-field" />
              </div>
            </div>

            <div>
              <label className="label-text block mb-1.5">Next Maintenance Date</label>
              <input {...register('maintenance_date')} type="date" className="input-field" />
            </div>

            <div>
              <label className="label-text block mb-1.5">Description</label>
              <textarea {...register('description')} rows={2} className="input-field resize-none"
                placeholder="Optional notes..." />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary"
                style={{ background: domainColor }}>
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  : isEdit ? `Update ${domainLabel} Asset` : `Add ${domainLabel} Asset`
                }
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}