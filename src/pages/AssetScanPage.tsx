import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Package, XCircle, Wrench, CheckCircle, AlertCircle, Briefcase, Monitor } from 'lucide-react'

/* ── Utility condition badge ─────────────────────────────────── */
function UtilityConditionBadge({ value }: { value: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    'Working - Assigned':   { color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    'Working - In Storage': { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    'For Testing':          { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    'Not Tested':           { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
    'Defective':            { color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
    'Damaged':              { color: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
    'For Disposal':         { color: '#fca5a5', bg: 'rgba(127,29,29,0.25)' },
  }
  const s = map[value] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' }
  if (!value) return <span style={{ color: '#64748b' }}>—</span>
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}40` }}>
      {value}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { icon: JSX.Element; label: string; color: string; bg: string }> = {
    active:      { icon: <CheckCircle size={13} />, label: 'Active',      color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    maintenance: { icon: <Wrench size={13} />,      label: 'Maintenance', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    defective:   { icon: <XCircle size={13} />,     label: 'Defective',   color: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
    disposed:    { icon: <AlertCircle size={13} />, label: 'Disposed',    color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
  }
  const c = cfg[status] || cfg.active
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
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
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
      style={{ color, background: `${color}20`, border: `1px solid ${color}40` }}>
      {condition}
    </span>
  )
}

/* ── Two-column grid field ───────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5"
        style={{ color: '#64748b' }}>
        {label}
      </p>
      <div className="text-sm font-medium" style={{ color: '#f1f5f9' }}>
        {children}
      </div>
    </div>
  )
}

function FieldValue({ value }: { value?: string | null }) {
  return <span style={{ color: value ? '#f1f5f9' : '#475569' }}>{value || '—'}</span>
}

function fmt(date?: string | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

/* ── Section wrapper ─────────────────────────────────────────── */
function Section({ title, delay = 0, children }: { title: string; delay?: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(30,41,59,0.7)',
        border: '1px solid rgba(148,163,184,0.1)',
        backdropFilter: 'blur(12px)',
      }}>
      <h2 className="text-base font-bold mb-4"
        style={{ color: '#f1f5f9', fontFamily: 'Barlow, sans-serif' }}>
        {title}
      </h2>
      {children}
    </motion.div>
  )
}

export default function AssetScanPage() {
  const { id } = useParams<{ id: string }>()
  const [asset, setAsset] = useState<any>(null)
  const [extra, setExtra] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      if (!id) { setError('Invalid QR code'); setLoading(false); return }
      try {
        const { data, error: err } = await supabase
          .from('assets')
          .select('*, category:asset_categories(id,name,type), building:buildings(id,name)')
          .eq('id', id)
          .single()
        if (err || !data) throw new Error('Asset not found')
        setAsset(data)

        if (data.domain === 'utility') {
          const { data: extraData } = await supabase
            .from('utility_asset_extras')
            .select('*')
            .eq('asset_id', id)
            .maybeSingle()
          setExtra(extraData)
        }
      } catch (e: any) {
        setError(e.message || 'Asset not found')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id])

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 animate-pulse"
            style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }} />
          <p style={{ color: '#64748b' }}>Loading asset information...</p>
        </div>
      </div>
    )
  }

  /* ── Error ── */
  if (error || !asset) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0f172a' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)' }}>
            <XCircle size={28} style={{ color: '#f43f5e' }} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#f1f5f9', fontFamily: 'Barlow, sans-serif' }}>
            Asset Not Found
          </h1>
          <p style={{ color: '#64748b' }}>{error || 'This QR code does not match any registered asset.'}</p>
        </div>
      </div>
    )
  }

  const isUtility = asset.domain === 'utility'
  const accentColor = isUtility ? '#10b981' : '#3b82f6'
  const gradient = isUtility
    ? 'linear-gradient(135deg,#10b981,#06b6d4)'
    : 'linear-gradient(135deg,#3b82f6,#8b5cf6)'

  return (
    <div className="min-h-screen" style={{ background: '#0f172a', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Topbar ── */}
      <div className="sticky top-0 z-10 px-5 py-3.5 flex items-center gap-3"
        style={{
          background: 'rgba(9,14,26,0.96)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(148,163,184,0.1)',
        }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: gradient }}>
          {isUtility
            ? <Briefcase size={15} className="text-white" />
            : <Monitor size={15} className="text-white" />}
        </div>
        <span className="font-bold text-base" style={{ color: '#f1f5f9', fontFamily: 'Barlow, sans-serif' }}>
          AssetVault
        </span>
        <span className="ml-auto text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ color: accentColor, background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}>
          {isUtility ? 'Utility Item' : 'IT Asset'}
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* ── Hero card ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(30,41,59,0.7)',
            border: '1px solid rgba(148,163,184,0.1)',
            backdropFilter: 'blur(12px)',
          }}>

          {/* Image */}
          {asset.image_url ? (
            <div className="w-full h-52 overflow-hidden">
              <img src={asset.image_url} alt={asset.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-40 flex items-center justify-center"
              style={{ background: 'rgba(51,65,85,0.4)' }}>
              {isUtility
                ? <Briefcase size={48} style={{ color: '#334155' }} />
                : <Package size={48} style={{ color: '#334155' }} />}
            </div>
          )}

          {/* Name + badges */}
          <div className="p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              {isUtility
                ? <UtilityConditionBadge value={extra?.utility_condition || ''} />
                : <>
                    <StatusBadge status={asset.status} />
                    <ConditionBadge condition={asset.condition} />
                  </>
              }
            </div>
            <h1 className="text-xl font-bold mb-1"
              style={{ color: '#f1f5f9', fontFamily: 'Barlow, sans-serif' }}>
              {asset.name}
            </h1>
            <p className="text-xs font-mono" style={{ color: accentColor }}>
              {asset.asset_code || '—'}
              {isUtility && <span className="font-sans ml-1" style={{ color: '#64748b' }}>(Stock ID)</span>}
            </p>
            {asset.description && (
              <p className="mt-2 text-sm" style={{ color: '#94a3b8' }}>{asset.description}</p>
            )}
          </div>
        </motion.div>

        {/* ── Item Details (matches the detail page grid exactly) ── */}
        <Section title="Item Details" delay={0.08}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Item Type">
              <FieldValue value={asset.category?.name} />
            </Field>
            <Field label="Bldg / Room">
              <FieldValue value={asset.building?.name} />
            </Field>
            <Field label="Stock ID">
              <FieldValue value={asset.asset_code} />
            </Field>
            <Field label="Serial Number">
              <FieldValue value={asset.serial_number} />
            </Field>
            <Field label="Location of Item">
              <FieldValue value={asset.assigned_to} />
            </Field>
            <Field label="Purchase Date">
              <FieldValue value={fmt(asset.purchase_date)} />
            </Field>
            <Field label="Added On">
              <FieldValue value={fmt(asset.created_at)} />
            </Field>
            {isUtility ? (
              <>
                <Field label="Age Span">
                  <FieldValue value={extra?.age_span} />
                </Field>
                <Field label="Date of Use">
                  <FieldValue value={fmt(extra?.date_of_use)} />
                </Field>
                <Field label="Workstation">
                  <FieldValue value={extra?.workstation} />
                </Field>
                <Field label="Designated Department">
                  <FieldValue value={extra?.designated_department} />
                </Field>
                <Field label="Direct Responsible Individual">
                  <FieldValue value={extra?.direct_responsible_individual} />
                </Field>
                <Field label="Condition">
                  <UtilityConditionBadge value={extra?.utility_condition || ''} />
                </Field>
              </>
            ) : (
              <Field label="Next Maintenance">
                <FieldValue value={fmt(asset.maintenance_date)} />
              </Field>
            )}
          </div>

          {/* Description / Note below the grid (full width) */}
          {(asset.description || extra?.note) && (
            <div className="mt-4 pt-4 space-y-3"
              style={{ borderTop: '1px solid rgba(148,163,184,0.08)' }}>
              {asset.description && (
                <Field label="Item Description">
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{asset.description}</span>
                </Field>
              )}
              {extra?.note && (
                <Field label="Note">
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{extra.note}</span>
                </Field>
              )}
            </div>
          )}
        </Section>

        {/* ── Footer ── */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="text-center text-xs pb-6" style={{ color: '#334155' }}>
          Scanned via AssetVault QR ·{' '}
          {isUtility ? 'Contact your Utility department for inquiries' : 'Contact your IT department for inquiries'}
        </motion.p>
      </div>
    </div>
  )
}