import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Cpu, ChevronLeft, ChevronRight, X, Eye, Pencil, Trash2 } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { assetService, buildingService, categoryService } from '@/services'
import { formatDate, getStatusColor, getConditionBadge, classNames } from '@/utils'
import { useAuth } from '@/features/auth/AuthContext'
import type { FilterState, Asset } from '@/types'
import AssetFormModal from '@/components/assets/AssetFormModal'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'
import { toast } from 'sonner'

export default function ITAssetsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const { isAdmin, isITAdmin } = useAuth()
  const canEdit = isAdmin || isITAdmin

  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    building: '', category: '', status: '', condition: '', dateFrom: '', dateTo: '',
  })
  const PAGE_SIZE = 10

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['it-assets', filters, page],
    queryFn: () => assetService.getByDomain('it', filters, page, PAGE_SIZE),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: buildings = [] } = useQuery({ queryKey: ['buildings'], queryFn: () => buildingService.getAll(), staleTime: 0, refetchOnWindowFocus: true })
  const { data: itCategories = [] } = useQuery({
    queryKey: ['categories-it'],
    queryFn: () => categoryService.getByType('it'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const assets = assetsData?.data || []
  const total = assetsData?.count || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleDelete = async () => {
    if (!deleteAsset) return
    setDeleteLoading(true)
    try {
      await assetService.delete(deleteAsset.id)
      toast.success('Asset deleted')
      setDeleteAsset(null)
      await qc.invalidateQueries({ queryKey: ['it-assets'] })
      await qc.invalidateQueries({ queryKey: ['it-dashboard-stats'] })
      await qc.invalidateQueries({ queryKey: ['recent-it-assets'] })
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete asset')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSuccess = async () => {
    setShowAddModal(false)
    setEditAsset(null)
    await qc.refetchQueries({ queryKey: ['it-assets'] })
    await qc.refetchQueries({ queryKey: ['it-dashboard-stats'] })
    await qc.refetchQueries({ queryKey: ['recent-it-assets'] })
  }

  return (
    <DashboardLayout title="IT Assets">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
              <Cpu size={14} className="text-white" />
            </div>
            <h1 className="page-title">IT Assets</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{total} IT assets registered</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={classNames('btn-secondary', showFilters && 'border-cyan-500/50 text-cyan-400')}>
            <Filter size={15} /> Filters
          </button>
          {canEdit && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary"
              style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
              <Plus size={15} /> Add IT Asset
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="input-field pl-11" placeholder="Search IT assets by name, code, serial number..." />
        {filters.search && (
          <button onClick={() => setFilters(f => ({ ...f, search: '' }))}
            className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="glass-card p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="label-text block mb-1.5">Building</label>
              <select value={filters.building} onChange={e => setFilters(f => ({ ...f, building: e.target.value }))} className="select-field">
                <option value="">All Buildings</option>
                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text block mb-1.5">IT Category</label>
              <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="select-field">
                <option value="">All IT Categories</option>
                {itCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text block mb-1.5">Status</label>
              <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="select-field">
                <option value="">All Status</option>
                {['active','inactive','maintenance','retired'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text block mb-1.5">Condition</label>
              <select value={filters.condition} onChange={e => setFilters(f => ({ ...f, condition: e.target.value }))} className="select-field">
                <option value="">All Conditions</option>
                {['excellent','good','fair','poor'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={() => setFilters({ search:'', building:'', category:'', status:'', condition:'', dateFrom:'', dateTo:'' })}
              className="btn-secondary text-xs py-1.5 px-3">Clear Filters</button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(6,182,212,0.05)' }}>
                {['Asset','Code','Category','Building','Status','Condition','Assigned To','Added','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full rounded" /></td>
                      ))}
                    </tr>
                  ))
                : assets.map((asset: any, idx: number) => (
                    <tr key={asset.id || idx} className="table-row-hover" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {asset.image_url
                            ? <img src={asset.image_url} alt={asset.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                            : <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: 'rgba(6,182,212,0.12)', color: '#06b6d4', fontSize: 13, fontWeight: 700 }}>
                                {asset.name?.[0]?.toUpperCase() || '?'}
                              </div>
                          }
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{asset.name}</p>
                            {asset.serial_number && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>S/N: {asset.serial_number}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="chip font-mono text-xs">{asset.asset_code || asset.code || '—'}</span></td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{asset.category?.name || asset.categoryName || '—'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {asset.building?.name || asset.buildingName || '—'}
                      </td>
                      <td className="px-4 py-3"><span className={getStatusColor(asset.status)} style={{ textTransform:'capitalize' }}>{asset.status}</span></td>
                      <td className="px-4 py-3"><span className={`badge ${getConditionBadge(asset.condition)}`} style={{ textTransform:'capitalize', fontSize:'11px' }}>{asset.condition || '—'}</span></td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{asset.assigned_to || '—'}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{formatDate(asset.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => navigate(`/assets/${asset.id}`)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-cyan-500/20"
                            style={{ color: 'var(--text-muted)' }} title="View"><Eye size={14} /></button>
                          {canEdit && <>
                            <button onClick={() => setEditAsset(asset)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-amber-500/20"
                              style={{ color: 'var(--text-muted)' }} title="Edit"><Pencil size={14} /></button>
                            <button onClick={() => setDeleteAsset(asset)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-rose-500/20"
                              style={{ color: 'var(--text-muted)' }} title="Delete"><Trash2 size={14} /></button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Showing {((page-1)*PAGE_SIZE)+1}–{Math.min(page*PAGE_SIZE,total)} of {total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40"
                style={{ background:'var(--bg-secondary)', color:'var(--text-secondary)' }}><ChevronLeft size={15}/></button>
              {Array.from({ length: Math.min(5,totalPages) },(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)}
                  className="w-8 h-8 rounded-lg text-sm font-medium"
                  style={{ background: page===p ? 'linear-gradient(135deg,#06b6d4,#3b82f6)' : 'var(--bg-secondary)', color: page===p ? 'white' : 'var(--text-secondary)' }}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40"
                style={{ background:'var(--bg-secondary)', color:'var(--text-secondary)' }}><ChevronRight size={15}/></button>
            </div>
          </div>
        )}
        {!isLoading && assets.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3" style={{ color: 'var(--text-muted)' }}>
            <Cpu size={40} className="opacity-20" />
            <p className="font-medium">No IT assets found</p>
          </div>
        )}
      </div>

      {(showAddModal || editAsset) && (
        <AssetFormModal
          asset={editAsset}
          domain="it"
          onClose={() => { setShowAddModal(false); setEditAsset(null) }}
          onSuccess={handleSuccess}
          buildings={buildings}
          categories={itCategories}
        />
      )}
      {deleteAsset && (
        <DeleteConfirmModal
          title="Delete IT Asset"
          message={`Delete "${deleteAsset.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteAsset(null)}
          loading={deleteLoading}
        />
      )}
    </DashboardLayout>
  )
}