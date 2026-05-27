import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  History, AlertTriangle, Wrench, Search, X,
  ChevronDown, ChevronUp, ChevronsUpDown, Building2, Filter
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { buildingService, categoryService } from '@/services'
import { formatDate } from '@/utils'
import { UTILITY_CONDITION_OPTIONS } from '@/types'

/* ── Condition badge ─────────────────────────────────────────── */
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
  const s = map[value] || { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' }
  if (!value) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap" style={s}>
      {value}
    </span>
  )
}

type TabKey = 'incident' | 'repair'
type SortDir = 'asc' | 'desc' | null

function SortIcon({ field, sort }: { field: string; sort: { field: string; dir: SortDir } }) {
  if (sort.field !== field) return <ChevronsUpDown size={12} style={{ color: '#475569' }} />
  return sort.dir === 'asc'
    ? <ChevronUp size={12} style={{ color: '#10b981' }} />
    : <ChevronDown size={12} style={{ color: '#10b981' }} />
}

export default function UtilityHistoryPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('incident')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterBuilding, setFilterBuilding] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCondition, setFilterCondition] = useState('')
  const [sort, setSort] = useState<{ field: string; dir: SortDir }>({ field: 'date', dir: 'desc' })

  const { data: buildings = [] } = useQuery({ queryKey: ['buildings'], queryFn: () => buildingService.getAll(), staleTime: 0 })
  const { data: utilityCategories = [] } = useQuery({ queryKey: ['categories-utility'], queryFn: () => categoryService.getByType('utility'), staleTime: 0 })

  /* ── Fetch all extras that have incident OR repair data ── */
  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['utility-history-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('utility_asset_extras')
        .select(`
          *,
          asset:assets(
            id, name, asset_code, assigned_to, domain,
            category:asset_categories(id, name),
            building:buildings(id, name)
          )
        `)
        .eq('asset.domain', 'utility')
      if (error) throw error
      return (data || []).filter((r: any) => r.asset !== null)
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const incidentRecords = allRecords.filter((r: any) =>
    r.damage_description || r.damage_date_reported || r.damage_reported_by || r.damage_recommendation
  )

  const repairRecords = allRecords.filter((r: any) =>
    r.repair_details || r.repair_date || r.repair_remarks
  )

  const activeRecords = activeTab === 'incident' ? incidentRecords : repairRecords

  /* ── Filter + search ── */
  const filtered = activeRecords.filter((r: any) => {
    const asset = r.asset || {}
    if (search) {
      const q = search.toLowerCase()
      const match =
        asset.name?.toLowerCase().includes(q) ||
        asset.asset_code?.toLowerCase().includes(q) ||
        r.damage_description?.toLowerCase().includes(q) ||
        r.damage_reported_by?.toLowerCase().includes(q) ||
        r.repair_details?.toLowerCase().includes(q) ||
        r.repair_remarks?.toLowerCase().includes(q)
      if (!match) return false
    }
    if (filterBuilding && asset.building?.id !== filterBuilding) return false
    if (filterCategory && asset.category?.id !== filterCategory) return false
    if (filterCondition && r.utility_condition !== filterCondition) return false
    return true
  })

  /* ── Sort ── */
  const sorted = [...filtered].sort((a: any, b: any) => {
    if (!sort.field || !sort.dir) return 0
    const getV = (r: any) => {
      if (sort.field === 'asset')    return r.asset?.name || ''
      if (sort.field === 'code')     return r.asset?.asset_code || ''
      if (sort.field === 'building') return r.asset?.building?.name || ''
      if (sort.field === 'category') return r.asset?.category?.name || ''
      if (sort.field === 'date')
        return activeTab === 'incident' ? (r.damage_date_reported || '') : (r.repair_date || '')
      if (sort.field === 'reporter')
        return activeTab === 'incident' ? (r.damage_reported_by || '') : (r.repair_remarks || '')
      if (sort.field === 'condition') return r.utility_condition || ''
      return ''
    }
    const av = getV(a).toLowerCase()
    const bv = getV(b).toLowerCase()
    return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  const toggleSort = (field: string) =>
    setSort(s => ({
      field,
      dir: s.field === field ? (s.dir === 'asc' ? 'desc' : s.dir === 'desc' ? null : 'asc') : 'asc',
    }))

  const hasFilters = search || filterBuilding || filterCategory || filterCondition
  const activeFilterCount = [filterBuilding, filterCategory, filterCondition].filter(Boolean).length

  const clearFilters = () => {
    setSearch(''); setFilterBuilding(''); setFilterCategory(''); setFilterCondition('')
  }

  /* ── Summary counts ── */
  const totalIncidents = incidentRecords.length
  const totalRepairs   = repairRecords.length
  const withBothCount  = allRecords.filter((r: any) =>
    (r.damage_description || r.damage_date_reported) && (r.repair_details || r.repair_date)
  ).length

  const incidentCols = [
    { key: 'asset',     label: 'Item Model' },
    { key: 'code',      label: 'Stock ID' },
    { key: 'category',  label: 'Item Type' },
    { key: 'building',  label: 'Bldg / Room' },
    { key: 'date',      label: 'Date Reported' },
    { key: 'reporter',  label: 'Reported By' },
    { key: 'condition', label: 'Condition' },
  ]

  const repairCols = [
    { key: 'asset',     label: 'Item Model' },
    { key: 'code',      label: 'Stock ID' },
    { key: 'category',  label: 'Item Type' },
    { key: 'building',  label: 'Bldg / Room' },
    { key: 'date',      label: 'Date of Repair' },
    { key: 'reporter',  label: 'Repair Remarks' },
    { key: 'condition', label: 'Condition' },
  ]

  const cols = activeTab === 'incident' ? incidentCols : repairCols

  return (
    <DashboardLayout title="Utility History">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
              <History size={14} className="text-white" />
            </div>
            <h1 className="page-title">Utility History</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Incident reports and repair logs for all utility items
          </p>
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className="btn-secondary relative"
          style={showFilters ? { borderColor: 'rgba(16,185,129,0.5)', color: '#10b981' } : {}}>
          <Filter size={14} /> Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: '#10b981', color: '#fff' }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Incidents',    value: totalIncidents, color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.2)',  icon: AlertTriangle },
          { label: 'Total Repairs',      value: totalRepairs,   color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', icon: Wrench },
          { label: 'Repaired After Incident', value: withBothCount, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', icon: History },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card p-4 flex items-center gap-3"
            style={{ border: `1px solid ${s.border}`, background: s.bg }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${s.color}22` }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'Barlow, sans-serif' }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
        {[
          { key: 'incident', label: 'Incident Reports', icon: AlertTriangle, color: '#f43f5e', count: totalIncidents },
          { key: 'repair',   label: 'Repair Logs',      icon: Wrench,        color: '#10b981', count: totalRepairs   },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key as TabKey)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={activeTab === tab.key
              ? { background: tab.key === 'incident' ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)',
                  color: tab.color, border: `1px solid ${tab.color}33` }
              : { color: 'var(--text-muted)', border: '1px solid transparent' }}>
            <tab.icon size={14} />
            {tab.label}
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: activeTab === tab.key ? `${tab.color}22` : 'var(--bg-tertiary)',
                       color: activeTab === tab.key ? tab.color : 'var(--text-muted)' }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-8 text-sm py-2"
          placeholder={activeTab === 'incident'
            ? 'Search by item, stock ID, description, reporter...'
            : 'Search by item, stock ID, repair details, remarks...'} />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="glass-card p-4 mb-4 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}>All Item Types</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="select-field text-sm">
                <option value="">All Item Types</option>
                {utilityCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}>All Buildings</label>
              <select value={filterBuilding} onChange={e => setFilterBuilding(e.target.value)} className="select-field text-sm">
                <option value="">All Buildings</option>
                {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}>All Conditions</label>
              <select value={filterCondition} onChange={e => setFilterCondition(e.target.value)} className="select-field text-sm">
                <option value="">All Conditions</option>
                {UTILITY_CONDITION_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
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

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading history...</div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center">
            {activeTab === 'incident'
              ? <AlertTriangle size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
              : <Wrench size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />}
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {hasFilters
                ? 'No records match your filters.'
                : activeTab === 'incident'
                  ? 'No incident reports recorded yet.'
                  : 'No repair logs recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 860 }}>
              <thead className="sticky top-0 z-10"
                style={{ background: 'rgba(9,14,26,0.97)', backdropFilter: 'blur(8px)' }}>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                  {cols.map(col => (
                    <th key={col.key}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
                      style={{ color: sort.field === col.key ? '#10b981' : 'var(--text-muted)' }}
                      onClick={() => toggleSort(col.key)}>
                      <div className="flex items-center gap-1">
                        {col.label}
                        <SortIcon field={col.key} sort={sort} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                    {activeTab === 'incident' ? 'Damage Details' : 'Repair Details'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((record: any, i: number) => {
                  const asset = record.asset || {}
                  const isEven = i % 2 === 0
                  return (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      className="group cursor-pointer transition-colors"
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isEven ? 'rgba(15,23,42,0.3)' : 'rgba(30,41,59,0.2)',
                      }}
                      onClick={() => navigate(`/assets/${asset.id}`)}>
                      {/* Item Model */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-bold"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                            {asset.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)', maxWidth: 140 }}
                            title={asset.name}>
                            {asset.name || '—'}
                          </span>
                        </div>
                      </td>
                      {/* Stock ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--bg-tertiary)', color: '#60a5fa' }}>
                          {asset.asset_code || '—'}
                        </span>
                      </td>
                      {/* Item Type */}
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {asset.category?.name || '—'}
                      </td>
                      {/* Bldg / Room */}
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} style={{ color: 'var(--text-muted)' }} />
                          {asset.building?.name || '—'}
                        </div>
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                        {activeTab === 'incident'
                          ? (record.damage_date_reported ? formatDate(record.damage_date_reported) : '—')
                          : (record.repair_date ? formatDate(record.repair_date) : '—')}
                      </td>
                      {/* Reporter / Remarks label */}
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {activeTab === 'incident'
                          ? (record.damage_reported_by || '—')
                          : (record.repair_remarks || '—')}
                      </td>
                      {/* Condition */}
                      <td className="px-4 py-3">
                        <ConditionBadge value={record.utility_condition || ''} />
                      </td>
                      {/* Details */}
                      <td className="px-4 py-3" style={{ maxWidth: 260 }}>
                        {activeTab === 'incident' ? (
                          <div className="space-y-0.5">
                            {record.damage_description && (
                              <p className="text-xs line-clamp-2"
                                style={{ color: 'var(--text-secondary)' }}
                                title={record.damage_description}>
                                {record.damage_description}
                              </p>
                            )}
                            {record.damage_recommendation && (
                              <p className="text-xs italic"
                                style={{ color: 'var(--text-muted)' }}
                                title={record.damage_recommendation}>
                                Rec: {record.damage_recommendation}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs line-clamp-2"
                            style={{ color: 'var(--text-secondary)' }}
                            title={record.repair_details}>
                            {record.repair_details || '—'}
                          </p>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!isLoading && sorted.length > 0 && (
          <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing {sorted.length} {activeTab === 'incident' ? 'incident report' : 'repair log'}{sorted.length !== 1 ? 's' : ''}
              {hasFilters && ` (filtered)`}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}