import { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Camera, Image as ImageIcon } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useQuery } from '@tanstack/react-query'
import { assetService, categoryService } from '@/services'
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
  status:           z.enum(['active','defective','maintenance','disposed']),
  condition:        z.enum(['excellent','good','fair','poor']),
  assigned_to:      z.string().optional(),
  purchase_date:    z.string().optional(),
  maintenance_date: z.string().optional(),
})
type FormValues = z.infer<typeof assetSchema>

interface AssetFormModalProps {
  asset?:      Asset | null
  domain:      AssetDomain
  onClose:     () => void
  onSuccess:   () => void
  buildings:   Building[]
  categories?: AssetCategory[]
}

/** Convert any image File to .webp at max 1600px, returns a new File */
async function toWebP(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1600
      let { width, height } = img
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height)
        width  = Math.round(width  * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => {
          URL.revokeObjectURL(url)
          if (!blob) return reject(new Error('WebP conversion failed'))
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' }))
        },
        'image/webp',
        0.88
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

export default function AssetFormModal({ asset, domain, onClose, onSuccess, buildings }: AssetFormModalProps) {
  const { user } = useAuthStore()
  const [loading, setLoading]           = useState(false)
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(asset?.image_url || '')
  const cameraRef = useRef<HTMLInputElement>(null)
  const isEdit = !!asset

  const { data: categories = [] } = useQuery<AssetCategory[]>({
    queryKey: ['categories-modal', domain],
    queryFn: () => categoryService.getByType(domain as 'it' | 'utility'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name:             asset?.name             || '',
      description:      asset?.description      || '',
      category_id:      asset?.category_id      || '',
      building_id:      asset?.building_id      || '',
      asset_code:       asset?.asset_code       || '',
      serial_number:    asset?.serial_number    || '',
      status:           (asset?.status as any)  || 'active',
      condition:        (asset?.condition as any)|| 'good',
      assigned_to:      asset?.assigned_to      || '',
      purchase_date:    asset?.purchase_date    || '',
      maintenance_date: asset?.maintenance_date || '',
    },
  })

  const processImage = async (file: File) => {
    try {
      const webp = await toWebP(file)
      setImageFile(webp)
      setImagePreview(URL.createObjectURL(webp))
    } catch {
      toast.error('Failed to process image')
    }
  }

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) processImage(files[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg','.jpeg','.png','.webp','.heic'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB before conversion
  })

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await processImage(file)
    // reset so same file can be re-captured
    e.target.value = ''
  }

  const clearImage = () => {
    setImagePreview('')
    setImageFile(null)
  }

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

            {/* Image — upload OR camera capture */}
            <div>
              <label className="label-text block mb-2">Asset Image</label>

              {imagePreview ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: 'rgba(0,0,0,0.6)', color: '#10b981' }}>
                      .webp ✓
                    </span>
                    <button type="button" onClick={clearImage}
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.6)' }}>
                      <X size={13} className="text-white"/>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Drag & drop / file pick */}
                  <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-blue-400 bg-blue-400/5' : 'border-slate-700 hover:border-slate-500'}`}>
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-1.5">
                      {isDragActive
                        ? <ImageIcon size={26} className="text-blue-400"/>
                        : <Upload size={26} style={{ color:'var(--text-muted)' }}/>}
                      <p className="text-sm" style={{ color:'var(--text-secondary)' }}>
                        {isDragActive ? 'Drop to upload' : 'Drag & drop or tap to choose from gallery'}
                      </p>
                      <p className="text-xs" style={{ color:'var(--text-muted)' }}>
                        Any image — auto-converted to .webp
                      </p>
                    </div>
                  </div>

                  {/* Camera capture button — shows native camera on mobile */}
                  <button type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      background: 'rgba(59,130,246,0.08)',
                      border: '1px solid rgba(59,130,246,0.25)',
                      color: '#60a5fa',
                    }}>
                    <Camera size={16} />
                    Take Photo with Camera
                  </button>
                  {/* Hidden input: capture="environment" opens rear camera on mobile */}
                  <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCameraCapture}
                  />
                </div>
              )}
            </div>

            {/* Name + serial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-1.5">Asset Name <span className="text-rose-400">*</span></label>
                <input {...register('name')} className="input-field"
                  placeholder={domain === 'it' ? 'e.g. Dell Latitude 5520' : 'e.g. Executive Chair'} />
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
                {categories.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    No {domainLabel} categories — ask a Tech Admin to add some.
                  </p>
                )}
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
              <input {...register('asset_code')} className="input-field font-mono"
                placeholder="e.g. IT-001, AST-2024-001" />
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
                <input {...register('assigned_to')} className="input-field"
                  placeholder="e.g. John Doe / IT Department" />
              </div>
              <div>
                <label className="label-text block mb-1.5">
                  Purchase Date <span className="text-xs" style={{ color:'var(--text-muted)' }}>(optional)</span>
                </label>
                <input {...register('purchase_date')} type="date" className="input-field" />
              </div>
            </div>

            {/* Next Maintenance Date — IT only, hidden for Utility */}
            {domain === 'it' && (
              <div>
                <label className="label-text block mb-1.5">
                  Next Maintenance Date <span className="text-xs" style={{ color:'var(--text-muted)' }}>(optional)</span>
                </label>
                <input {...register('maintenance_date')} type="date" className="input-field" />
              </div>
            )}

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