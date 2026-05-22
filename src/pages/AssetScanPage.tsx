import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Package, MapPin, Tag, User, Hash, Calendar, CheckCircle, AlertCircle, XCircle, Wrench } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { icon: JSX.Element; label: string; color: string; bg: string }> = {
    active:      { icon: <CheckCircle size={14} />, label: 'Active',      color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    maintenance: { icon: <Wrench size={14} />,      label: 'Maintenance', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    inactive:    { icon: <XCircle size={14} />,     label: 'Inactive',    color: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
    retired:     { icon: <AlertCircle size={14} />, label: 'Retired',     color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
  }
  const c = cfg[status] || cfg.inactive
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.color}40` }}>
      {c.icon}{c.label}
    </span>
  )
}

function ConditionBadge({ condition }: { condition: string }) {
  const colors: Record<string, string> = {
    excellent: '#10b981', good: '#3b82f6', fair: '#f59e0b', poor: '#f43f5e'
  }
  const color = colors[condition] || '#94a3b8'
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize"
      style={{ color, background: `${color}20`, border: `1px solid ${color}40` }}>
      {condition}
    </span>
  )
}

export default function AssetScanPage() {
  const { id } = useParams<{ id: string }>()
  const [asset, setAsset] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAsset = async () => {
      if (!id) { setError('Invalid QR code'); setLoading(false); return }
      try {
        const { data, error: err } = await supabase
          .from('assets')
          .select('*, category:asset_categories(id,name,type), building:buildings(id,name)')
          .eq('id', id)
          .single()
        if (err || !data) throw new Error('Asset not found')
        setAsset(data)
      } catch (e: any) {
        setError(e.message || 'Asset not found')
      } finally {
        setLoading(false)
      }
    }
    fetchAsset()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 animate-pulse" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }} />
          <p style={{ color: '#64748b' }}>Loading asset information...</p>
        </div>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0f172a' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)' }}>
            <XCircle size={28} style={{ color: '#f43f5e' }} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#f1f5f9', fontFamily: 'Barlow, sans-serif' }}>Asset Not Found</h1>
          <p style={{ color: '#64748b' }}>{error || 'This QR code does not match any registered asset.'}</p>
        </div>
      </div>
    )
  }

  const details = [
    { icon: Hash,     label: 'Asset Code',    value: asset.asset_code },
    { icon: Tag,      label: 'Category',      value: asset.category?.name },
    { icon: MapPin,   label: 'Building',      value: asset.building?.name },
    { icon: MapPin,   label: 'Location',      value: asset.floor_room },
    { icon: User,     label: 'Assigned To',   value: asset.assigned_to },
    { icon: Hash,     label: 'Serial Number', value: asset.serial_number },
    { icon: Calendar, label: 'Purchase Date', value: asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : null },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      {/* Header bar */}
      <div className="sticky top-0 z-10 px-6 py-4 flex items-center gap-3"
        style={{ background: 'rgba(9,14,26,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
          <Package size={16} className="text-white" />
        </div>
        <span className="font-bold text-lg" style={{ color: '#f1f5f9', fontFamily: 'Barlow, sans-serif' }}>AssetVault</span>
        <span className="ml-auto text-xs px-2.5 py-1 rounded-full" style={{ color: '#94a3b8', background: 'rgba(148,163,184,0.1)' }}>
          Asset Info
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
        {/* Asset image + name */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(148,163,184,0.1)', backdropFilter: 'blur(12px)' }}>

          {asset.image_url ? (
            <div className="w-full h-56 overflow-hidden">
              <img src={asset.image_url} alt={asset.name}
                className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-48 flex items-center justify-center"
              style={{ background: 'rgba(51,65,85,0.5)' }}>
              <Package size={56} style={{ color: '#475569' }} />
            </div>
          )}

          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <StatusBadge status={asset.status} />
              <ConditionBadge condition={asset.condition} />
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9', fontFamily: 'Barlow, sans-serif' }}>
              {asset.name}
            </h1>
            <div className="flex items-center gap-1.5">
              <Hash size={13} style={{ color: '#64748b' }} />
              <code className="text-sm font-mono" style={{ color: '#3b82f6' }}>
                {asset.asset_code || '—'}
              </code>
            </div>
            {asset.description && (
              <p className="mt-3 text-sm" style={{ color: '#94a3b8' }}>{asset.description}</p>
            )}
          </div>
        </motion.div>

        {/* Details */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(148,163,184,0.1)', backdropFilter: 'blur(12px)' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#f1f5f9', fontFamily: 'Barlow, sans-serif' }}>
            Asset Details
          </h2>
          <div className="space-y-4">
            {details.filter(d => d.value).map((d, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(51,65,85,0.8)' }}>
                  <d.icon size={15} style={{ color: '#64748b' }} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b' }}>
                    {d.label}
                  </p>
                  <p className="text-sm font-medium mt-0.5" style={{ color: '#f1f5f9' }}>
                    {d.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-center text-xs pb-4" style={{ color: '#475569' }}>
          Scanned via AssetVault QR · For inquiries contact your IT department
        </motion.p>
      </div>
    </div>
  )
}
