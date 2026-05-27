import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Armchair, Pencil, Trash2, Filter,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, X
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { assetService, buildingService, categoryService, utilityExtraService } from '@/services'
import { formatDate } from '@/utils'
import { useAuth } from '@/features/auth/AuthContext'
import type { Asset } from '@/types'
import { UTILITY_CONDITION_OPTIONS, DESIGNATED_DEPARTMENT_OPTIONS } from '@/types'
import UtilityFormModal from '@/components/assets/Utilityformmodal'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'
import { toast } from 'sonner'

/* ─── Condition badge ─────────────────────────────────────────── */
function ConditionBadge({ value }: { value: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'Working - Assigned':   { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
    'Working - In Storage': { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
    'For Testing':          { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
    'Not Tested':           { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
    'Defective':            { bg: 'rgba(249,115,22,0.15)',  color: '#f97316' },
    'Damaged':              { bg: 'rgba(244,63,94,0.15)',   color: '#f43f5e' },
    'For Disposal':         { bg: 'rgba(127,29,29,0.25)',   color: '#fca5a5' },
  }
  const style = map[value] || { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' }
  if (!value) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={style}>
      {value}
    </span>
  )
}

/* ─── Truncated cell with tooltip ───────────────────────────── */
function TruncCell({ value, maxW = 120 }: { value: string; maxW?: number }) {
  if (!value) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  return (
    <span title={value} className="block truncate text-sm cursor-default"
      style={{ maxWidth: maxW, color: 'var(--text-secondary)' }}>
      {value}
    </span>
  )
}

/* ─── Sort helper ────────────────────────────────────────────── */
type SortDir = 'asc' | 'desc' | null
function SortIcon({ field, sort }: { field: string; sort: { field: string; dir: SortDir } }) {
  if (sort.field !== field) return <ChevronsUpDown size={12} style={{ color: '#475569' }} />
  return sort.dir === 'asc'
    ? <ChevronUp size={12} style={{ color: '#10b981' }} />
    : <ChevronDown size={12} style={{ color: '#10b981' }} />
}

const COLS = [
  { key: 'category',    label: 'Item Type' },
  { key: 'name',        label: 'Item Model' },
  { key: 'asset_code',  label: 'Stock ID' },
  { key: 'assigned_to', label: 'Location of Item' },
  { key: 'building',    label: 'Bldg / Room' },
  { key: 'workstation', label: 'Work Station' },
  { key: 'date_of_use', label: 'Date of Use' },
  { key: 'age_span',    label: 'Age Span' },
  { key: 'condition',   label: 'Condition' },
]

export default function UtilityAssetsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isAdmin, isUtility } = useAuth()
  const canEdit = isAdmin || isUtility

  const [showModal, setShowModal]           = useState(false)
  const [editAsset, setEditAsset]           = useState<Asset | null>(null)
  const [deleteAsset, setDeleteAsset]       = useState<Asset | null>(null)
  const [deleteLoading, setDeleteLoading]   = useState(false)
  const [expandedId, setExpandedId]         = useState<string | null>(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  const [search, setSearch]                         = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedBuilding, setSelectedBuilding]     = useState('')
  const [selectedCondition, setSelectedCondition]   = useState('')
  const [selectedDept, setSelectedDept]             = useState('')
  const [sort, setSort] = useState<{ field: string; dir: SortDir }>({ field: '', dir: null })

  const { data: buildings = [] }        = useQuery({ queryKey: ['buildings'],          queryFn: () => buildingService.getAll(),              staleTime: 0 })
  const { data: utilityCategories = [] } = useQuery({ queryKey: ['categories-utility'], queryFn: () => categoryService.getByType('utility'), staleTime: 0 })

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['utility-assets', selectedCategoryId, search, selectedBuilding],
    queryFn: () => assetService.getByDomain('utility', { search, category: selectedCategoryId, building: selectedBuilding }, 1, 500),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const allAssets: Asset[] = assetsData?.data || []
  const assetIds = allAssets.map(a => a.id)

  const { data: allExtras = [] } = useQuery({
    queryKey: ['utility-extras-bulk', assetIds.join(',')],
    queryFn: async () => {
      if (!assetIds.length) return []
      const { data } = await (await import('@/lib/supabase')).supabase
        .from('utility_asset_extras')
        .select('*')
        .in('asset_id', assetIds)
      return data || []
    },
    enabled: assetIds.length > 0,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const extrasMap: Record<string, any> = {}
  allExtras.forEach((e: any) => { extrasMap[e.asset_id] = e })

  const rows = allAssets.map(a => ({ ...a, extra: extrasMap[a.id] || {} }))

  // Client-side filter by condition + department
  const filtered = rows.filter(a => {
    if (selectedCondition && a.extra.utility_condition !== selectedCondition) return false
    if (selectedDept      && a.extra.designated_department !== selectedDept)  return false
    return true
  })

  // Sort
  const sorted = [...filtered].sort((a: any, b: any) => {
    if (!sort.field || !sort.dir) return 0
    const getVal = (row: any) => {
      if (sort.field === 'category')    return row.category?.name || ''
      if (sort.field === 'building')    return row.building?.name || ''
      if (sort.field === 'workstation') return row.extra.workstation || ''
      if (sort.field === 'department')  return row.extra.designated_department || ''
      if (sort.field === 'date_of_use') return row.extra.date_of_use || ''
      if (sort.field === 'age_span')    return row.extra.age_span || ''
      if (sort.field === 'condition')   return row.extra.utility_condition || ''
      if (sort.field === 'dri')         return row.extra.direct_responsible_individual || ''
      return (row as any)[sort.field] || ''
    }
    const av = getVal(a).toString().toLowerCase()
    const bv = getVal(b).toString().toLowerCase()
    return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  const toggleSort = (field: string) => {
    setSort(s => ({
      field,
      dir: s.field === field ? (s.dir === 'asc' ? 'desc' : s.dir === 'desc' ? null : 'asc') : 'asc'
    }))
  }

  const handleDelete = async () => {
    if (!deleteAsset) return
    setDeleteLoading(true)
    try {
      await assetService.delete(deleteAsset.id)
      toast.success('Item deleted')
      setDeleteAsset(null)
      await qc.invalidateQueries({ queryKey: ['utility-assets'] })
      await qc.invalidateQueries({ queryKey: ['utility-dashboard-stats'] })
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete item')
    } finally { setDeleteLoading(false) }
  }

  const handleSuccess = async () => {
    setShowModal(false)
    setEditAsset(null)
    await qc.invalidateQueries({ queryKey: ['utility-assets'] })
    await qc.invalidateQueries({ queryKey: ['utility-extras-bulk'] })
    await qc.invalidateQueries({ queryKey: ['utility-dashboard-stats'] })
  }

  const clearFilters = () => {
    setSearch(''); setSelectedCategoryId(''); setSelectedBuilding('')
    setSelectedCondition(''); setSelectedDept('')
  }
  const hasFilters = search || selectedCategoryId || selectedBuilding || selectedCondition || selectedDept
  const activeFilterCount = [selectedCategoryId, selectedBuilding, selectedCondition, selectedDept].filter(Boolean).length

  return (
    <DashboardLayout title="Utility Assets">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
              <Armchair size={14} className="text-white" />
            </div>
            <h1 className="page-title">Utility Assets</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {sorted.length} item{sorted.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter button beside Add Item */}
          <button
            onClick={() => setShowFilterPanel(v => !v)}
            className="btn-secondary relative"
            style={showFilterPanel ? { borderColor: 'rgba(16,185,129,0.5)', color: '#10b981' } : {}}>
            <Filter size={14} />
            Filter
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: '#10b981', color: '#fff' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          {canEdit && (
            <button onClick={() => { setEditAsset(null); setShowModal(true) }} className="btn-primary"
              style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
              <Plus size={15} /> Add Item
            </button>
          )}
        </div>
      </div>

      {/* Search bar always visible */}
      <div className="relative mb-3">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-8 text-sm py-2" placeholder="Search model, stock ID, location..." />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filter panel — shown when filter button is clicked */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 mb-4 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="label-text block mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>All Item Types</label>
                <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="select-field text-sm">
                  <option value="">All Item Types</option>
                  {utilityCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text block mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>All Buildings</label>
                <select value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)} className="select-field text-sm">
                  <option value="">All Buildings</option>
                  {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text block mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>All Conditions</label>
                <select value={selectedCondition} onChange={e => setSelectedCondition(e.target.value)} className="select-field text-sm">
                  <option value="">All Conditions</option>
                  {UTILITY_CONDITION_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text block mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>All Departments</label>
                <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="select-field text-sm">
                  <option value="">All Departments</option>
                  {DESIGNATED_DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            {hasFilters && (
              <div className="flex justify-end mt-3">
                <button onClick={clearFilters} className="btn-secondary text-xs py-1.5 px-3">Clear Filters</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading items...</div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center">
            <Armchair size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {hasFilters ? 'No items match your filters.' : 'No utility items yet. Add your first one.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full" style={{ minWidth: 900 }}>
              <thead className="sticky top-0 z-10" style={{ background: 'rgba(9,14,26,0.97)', backdropFilter: 'blur(8px)' }}>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                  <th className="w-8" />
                  {COLS.map(col => (
                    <th key={col.key}
                      className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
                      style={{ color: sort.field === col.key ? '#10b981' : 'var(--text-muted)' }}
                      onClick={() => toggleSort(col.key)}>
                      <div className="flex items-center gap-1">
                        {col.label}
                        <SortIcon field={col.key} sort={sort} />
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((asset: any, i: number) => {
                  const isExpanded = expandedId === asset.id
                  const extra = asset.extra || {}
                  const isEven = i % 2 === 0
                  return (
                    <>
                      <motion.tr
                        key={asset.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        className="group cursor-pointer transition-colors"
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: isEven ? 'rgba(15,23,42,0.3)' : 'rgba(30,41,59,0.2)',
                        }}
                        onClick={() => navigate(`/assets/${asset.id}`)}>
                        {/* Expand toggle */}
                        <td className="pl-3 py-3" onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : asset.id) }}>
                          <ChevronRight size={14}
                            className="transition-transform"
                            style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                        </td>
                        {/* Item Type */}
                        <td className="px-3 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {asset.category?.name || '—'}
                        </td>
                        {/* Item Model */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {asset.image_url
                              ? <img src={asset.image_url} alt={asset.name} className="w-7 h-7 rounded-md object-cover shrink-0" />
                              : <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-bold"
                                  style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                                  {asset.name?.[0]?.toUpperCase() || '?'}
                                </div>
                            }
                            <TruncCell value={asset.name} maxW={140} />
                          </div>
                        </td>
                        {/* Stock ID */}
                        <td className="px-3 py-3">
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--bg-tertiary)', color: '#60a5fa' }}>
                            {asset.asset_code || '—'}
                          </span>
                        </td>
                        {/* Location of Item */}
                        <td className="px-3 py-3"><TruncCell value={asset.assigned_to} /></td>
                        {/* Bldg / Room */}
                        <td className="px-3 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {asset.building?.name || '—'}
                        </td>
                        {/* Work Station */}
                        <td className="px-3 py-3"><TruncCell value={extra.workstation} /></td>
                        {/* Date of Use */}
                        <td className="px-3 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                          {extra.date_of_use ? formatDate(extra.date_of_use) : '—'}
                        </td>
                        {/* Age Span */}
                        <td className="px-3 py-3"><TruncCell value={extra.age_span} /></td>
                        {/* Condition — from utility_asset_extras */}
                        <td className="px-3 py-3"><ConditionBadge value={extra.utility_condition || ''} /></td>
                        {/* Actions */}
                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                              <>
                                <button onClick={() => setEditAsset(asset)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-500/20 transition-colors"
                                  style={{ color: 'var(--text-muted)' }} title="Edit">
                                  <Pencil size={13} />
                                </button>
                                <button onClick={() => setDeleteAsset(asset)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-500/20 transition-colors text-rose-400"
                                  title="Delete">
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>

                      {/* Expanded row */}
                      {isExpanded && (
                        <tr key={`exp-${asset.id}`}
                          style={{ background: 'rgba(16,185,129,0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                          <td />
                          <td colSpan={COLS.length + 1} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                                  style={{ color: 'var(--text-muted)' }}>Item Description</p>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                  {asset.description || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                                  style={{ color: 'var(--text-muted)' }}>Note</p>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                  {extra.note || '—'}
                                </p>
                              </div>
                              {extra.damage_description && (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider mb-1.5 text-rose-400">
                                    Damage / Incident
                                  </p>
                                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    {extra.damage_description}
                                  </p>
                                </div>
                              )}
                              {extra.repair_details && (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider mb-1.5 text-emerald-400">
                                    Repair Details
                                  </p>
                                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    {extra.repair_details}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {(showModal || editAsset) && (
        <UtilityFormModal
          asset={editAsset}
          onClose={() => { setShowModal(false); setEditAsset(null) }}
          onSuccess={handleSuccess}
        />
      )}
      {deleteAsset && (
        <DeleteConfirmModal
          title="Delete Utility Item"
          message={`Delete "${deleteAsset.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteAsset(null)}
          loading={deleteLoading}
        />
      )}
    </DashboardLayout>
  )
}