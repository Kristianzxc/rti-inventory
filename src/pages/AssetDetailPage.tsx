import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Package, QrCode, Pencil, Trash2,
  MapPin, Tag, User, Calendar, Activity, Wrench,
  Hash, AlertCircle, Download
} from 'lucide-react'
import QRCode from 'qrcode'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { assetService } from '@/services'
import { formatDate, getStatusColor, getConditionBadge, getCategoryIcon } from '@/utils'
import { useAuth } from '@/features/auth/AuthContext'
import AssetFormModal from '@/components/assets/AssetFormModal'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'
import { toast } from 'sonner'

export default function AssetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isAdmin } = useAuth()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetService.getById(id!),
    enabled: !!id,
  })

  const handleGenerateQR = async () => {
    if (!asset) return
    // Encode a public scan URL — when scanned, opens /scan/:id which shows asset details + image
    const scanUrl = `${window.location.origin}/scan/${asset.id}`
    const url = await QRCode.toDataURL(
      scanUrl,
      { width: 300, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } }
    )
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
      navigate('/assets')
    } catch {
      toast.error('Failed to delete asset')
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 w-full" />)}
        </div>
      </DashboardLayout>
    )
  }

  // Demo asset if no real data
  const displayAsset = asset || DEMO_ASSET

  return (
    <DashboardLayout>
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/assets')}
          className="btn-secondary py-2 px-3 text-sm">
          <ArrowLeft size={15} />
          Back to Assets
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleGenerateQR} className="btn-secondary">
            <QrCode size={15} />
            Generate QR
          </button>
          {isAdmin && (
            <>
              <button onClick={() => setShowEdit(true)} className="btn-secondary">
                <Pencil size={15} />
                Edit
              </button>
              <button onClick={() => setShowDelete(true)} className="btn-danger">
                <Trash2 size={15} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="flex items-start gap-5">
              {displayAsset.image_url ? (
                <img src={displayAsset.image_url} alt={displayAsset.name}
                  className="w-24 h-24 rounded-2xl object-cover shrink-0" />
              ) : (
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl shrink-0"
                  style={{ background: 'var(--bg-tertiary)' }}>
                  {getCategoryIcon(displayAsset.category?.name || '')}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={getStatusColor(displayAsset.status)} style={{ textTransform: 'capitalize' }}>
                    {displayAsset.status}
                  </span>
                  <span className={`badge ${getConditionBadge(displayAsset.condition)}`} style={{ textTransform: 'capitalize' }}>
                    {displayAsset.condition}
                  </span>
                </div>
                <h1 className="page-title mb-1">{displayAsset.name}</h1>
                <div className="flex items-center gap-1.5">
                  <Hash size={13} style={{ color: 'var(--text-muted)' }} />
                  <code className="text-sm font-mono" style={{ color: 'var(--accent-blue)' }}>
                    {displayAsset.asset_code || 'AST-000000'}
                  </code>
                </div>
                {displayAsset.description && (
                  <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>{displayAsset.description}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Details grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-6">
            <h2 className="section-title mb-5">Asset Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { icon: Tag, label: 'Category', value: displayAsset.category?.name },
                { icon: MapPin, label: 'Building', value: displayAsset.building?.name },
                //{ icon: MapPin, label: 'Floor / Room', value: displayAsset.floor_room },
                { icon: Hash, label: 'Serial Number', value: displayAsset.serial_number },
                { icon: User, label: 'Assigned To', value: displayAsset.assigned_to },
                { icon: Calendar, label: 'Purchase Date', value: formatDate(displayAsset.purchase_date) },
                { icon: Wrench, label: 'Next Maintenance', value: formatDate(displayAsset.maintenance_date) },
                { icon: Calendar, label: 'Added On', value: formatDate(displayAsset.created_at) },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'var(--bg-tertiary)' }}>
                    <item.icon size={15} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {item.label}
                    </p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: item.value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {item.value || '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* QR Code */}
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
                    <Download size={13} />
                    Download
                  </button>
                  <button onClick={handleGenerateQR} className="btn-secondary flex-1 justify-center text-xs py-2">
                    Regenerate
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--bg-tertiary)' }}>
                  <QrCode size={28} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                  Generate a QR code for this asset
                </p>
                <button onClick={handleGenerateQR} className="btn-primary w-full justify-center text-sm py-2">
                  Generate QR Code
                </button>
              </div>
            )}
          </motion.div>

          {/* Quick stats */}
          {/*<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-card p-5">
            <h3 className="section-title text-base mb-4">Asset Health</h3>
            <div className="space-y-3">
              {[
                { label: 'Overall Health', pct: displayAsset.condition === 'excellent' ? 95 : displayAsset.condition === 'good' ? 75 : displayAsset.condition === 'fair' ? 50 : 25, color: '#10b981' },
                { label: 'Utilization', pct: 72, color: '#3b82f6' },
                { label: 'Maintenance Score', pct: 88, color: '#8b5cf6' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span className="text-xs font-semibold" style={{ color: item.color }}>{item.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${item.pct}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>*/}

          {/* Alert if maintenance due */}
          {displayAsset.maintenance_date && new Date(displayAsset.maintenance_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="glass-card p-4 border border-amber-500/30"
              style={{ background: 'rgba(245,158,11,0.08)' }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={15} className="text-amber-400" />
                <p className="text-sm font-medium text-amber-400">Maintenance Due Soon</p>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Scheduled for {formatDate(displayAsset.maintenance_date)}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {showEdit && displayAsset && (
        <AssetFormModal
          asset={displayAsset as any}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); qc.invalidateQueries({ queryKey: ['asset', id] }) }}
          buildings={[]}
          categories={[]}
        />
      )}
      {showDelete && (
        <DeleteConfirmModal
          title="Delete Asset"
          message={`Are you sure you want to delete "${displayAsset.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </DashboardLayout>
  )
}

const DEMO_ASSET = {
  id: 'demo',
  asset_code: 'AST-001234',
  name: 'Dell Latitude 5520',
  description: 'Business laptop for engineering department use. Includes docking station.',
  status: 'active' as const,
  condition: 'good' as const,
  serial_number: 'DL5520-SN987654',
  floor_room: '2nd Floor, Room 201',
  assigned_to: 'John Doe',
  purchase_date: '2023-01-15',
  maintenance_date: '2024-03-15',
  image_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  category_id: '1',
  building_id: '1',
  created_by: null,
  category: { id: '1', name: 'Laptops', type: 'Technology', icon: null, created_at: '' },
  building: { id: '1', name: 'Building A', description: null, floors: 3, created_at: '' },
}
