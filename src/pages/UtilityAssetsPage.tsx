import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Armchair, Eye, Pencil, Trash2 } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { assetService, buildingService, categoryService } from '@/services'
import { getStatusColor, getConditionBadge, formatDate } from '@/utils'
import { useAuth } from '@/features/auth/AuthContext'
import type { Asset } from '@/types'
import AssetFormModal from '@/components/assets/AssetFormModal'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'
import { toast } from 'sonner'

export default function UtilityAssetsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isAdmin, isUtility } = useAuth()
  const canEdit = isAdmin || isUtility

  const [showModal, setShowModal]       = useState(false)
  const [editAsset, setEditAsset]       = useState<Asset | null>(null)
  const [deleteAsset, setDeleteAsset]   = useState<Asset | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedBuilding, setSelectedBuilding] = useState('')
  const [selectedStatus, setSelectedStatus]     = useState('')
  const [search, setSearch]             = useState('')

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingService.getAll(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: utilityCategories = [] } = useQuery({
    queryKey: ['categories-utility'],
    queryFn: () => categoryService.getByType('utility'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['utility-assets', selectedCategoryId, search, selectedBuilding, selectedStatus],
    queryFn: () => assetService.getByDomain('utility', {
      search,
      category: selectedCategoryId,
      building: selectedBuilding,
      status: selectedStatus,
    }, 1, 500),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const assets: Asset[] = assetsData?.data || []

  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleDelete = async () => {
    if (!deleteAsset) return
    setDeleteLoading(true)
    try {
      await assetService.delete(deleteAsset.id)
      toast.success('Asset deleted')
      setDeleteAsset(null)
      await qc.invalidateQueries({ queryKey: ['utility-assets'] })
      await qc.invalidateQueries({ queryKey: ['utility-dashboard-stats'] })
      await qc.invalidateQueries({ queryKey: ['recent-utility-assets'] })
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete asset')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSuccess = async () => {
    setShowModal(false)
    setEditAsset(null)
    await qc.refetchQueries({ queryKey: ['utility-assets'] })
    await qc.refetchQueries({ queryKey: ['utility-dashboard-stats'] })
    await qc.refetchQueries({ queryKey: ['recent-utility-assets'] })
  }

  return (
    <DashboardLayout title="Utility Assets">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
              <Armchair size={14} className="text-white" />
            </div>
            <h1 className="page-title">Utility Assets</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {assets.length} asset{assets.length !== 1 ? 's' : ''} found
          </p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditAsset(null); setShowModal(true) }} className="btn-primary"
            style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
            <Plus size={15} /> Add Utility Asset
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-sm" placeholder="Search by name or code..." />
        </div>

        <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="select-field text-sm min-w-40">
          <option value="">All Categories</option>
          {utilityCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)} className="select-field text-sm min-w-40">
          <option value="">All Buildings</option>
          {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="select-field text-sm min-w-36">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="inactive">Inactive</option>
          <option value="retired">Retired</option>
        </select>

        {(selectedCategoryId || selectedBuilding || selectedStatus || search) && (
          <button onClick={() => { setSelectedCategoryId(''); setSelectedBuilding(''); setSelectedStatus(''); setSearch('') }}
            className="btn-secondary text-sm">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center">
            <Armchair size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No utility assets found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.5)' }}>
                  {['Asset', 'Code', 'Category', 'Building', 'Status', 'Condition', 'Assigned To', 'Added', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets.map((asset: any, i: number) => (
                  <motion.tr key={asset.id || i}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="table-row-hover group"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {(asset as any).image_url
                          ? <img src={(asset as any).image_url} alt={asset.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          : <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: 12, fontWeight: 700 }}>
                              {asset.name?.[0]?.toUpperCase() || '?'}
                            </div>
                        }
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="chip font-mono text-xs">{asset.asset_code || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {asset.category?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {asset.building?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStatusColor(asset.status)} style={{ textTransform: 'capitalize' }}>
                        {asset.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getConditionBadge(asset.condition)}`}
                        style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                        {asset.condition || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {asset.assigned_to || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(asset.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/assets/${asset.id}`)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-cyan-500/20 transition-colors"
                          style={{ color: 'var(--text-muted)' }}>
                          <Eye size={13} />
                        </button>
                        {canEdit && (
                          <>
                            <button onClick={() => setEditAsset(asset)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-500/20 transition-colors"
                              style={{ color: 'var(--text-muted)' }}>
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setDeleteAsset(asset)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-500/20 transition-colors text-rose-400">
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showModal || editAsset) && (
        <AssetFormModal
          asset={editAsset}
          domain="utility"
          onClose={() => { setShowModal(false); setEditAsset(null) }}
          onSuccess={handleSuccess}
          buildings={buildings}
          categories={utilityCategories}
        />
      )}

      {deleteAsset && (
        <DeleteConfirmModal
          title="Delete Utility Asset"
          message={`Delete "${deleteAsset.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteAsset(null)}
          loading={deleteLoading}
        />
      )}
    </DashboardLayout>
  )
}