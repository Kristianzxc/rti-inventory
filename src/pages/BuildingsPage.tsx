import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Building2, Plus, Pencil, Trash2, Package } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'
import { buildingService } from '@/services'
import { useAuth } from '@/features/auth/AuthContext'
import { toast } from 'sonner'

export default function BuildingsPage() {
  const qc = useQueryClient()
  const { isAdmin } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editBuilding, setEditBuilding] = useState<any>(null)
  const [deleteBuilding, setDeleteBuilding] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '' })

  const { data: buildings = [], isLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingService.getAll(),
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  const openAdd = () => {
    setEditBuilding(null)
    setForm({ name: '', description: '' })
    setShowModal(true)
  }

  const openEdit = (building: any) => {
    setEditBuilding(building)
    setForm({ name: building.name, description: building.description || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editBuilding) {
        await buildingService.update(editBuilding.id, form)
        toast.success('Building updated')
      } else {
        await buildingService.create({ ...form, floors: 1 })
        toast.success('Building created')
      }
      await qc.invalidateQueries({ queryKey: ['buildings'] })
      setShowModal(false)
      setEditBuilding(null)
      setForm({ name: '', description: '' })
    } catch {
      toast.error('Failed to save building')
    }
  }

  const handleDelete = async () => {
    try {
      await buildingService.delete(deleteBuilding.id)
      toast.success('Building deleted')
      await qc.invalidateQueries({ queryKey: ['buildings'] })
      setDeleteBuilding(null)
    } catch {
      toast.error('Failed to delete building')
    }
  }

  return (
    <DashboardLayout title="Buildings">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Buildings</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {buildings.length} locations registered
          </p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary">
            <Plus size={15} />
            Add Building
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-40 w-full" />)}
        </div>
      ) : buildings.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Building2 size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No buildings yet. Add your first building.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buildings.map((building: any, i: number) => (
            <motion.div
              key={building.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                  <Building2 size={22} className="text-white" />
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(building)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteBuilding(building)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-rose-500/20 text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{building.name}</h3>
              {building.description && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{building.description}</p>
              )}

              <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="ml-auto">
                  <a href={`/assets?building=${building.id}`}
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-blue-300"
                    style={{ color: 'var(--accent-blue)' }}>
                    <Package size={12} />
                    View assets
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-card p-6"
          >
            <h2 className="section-title mb-5">{editBuilding ? 'Edit Building' : 'Add Building'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text block mb-1.5">Building Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Building A"
                  required
                />
              </div>
              <div>
                <label className="label-text block mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">
                  {editBuilding ? 'Update Building' : 'Add Building'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {deleteBuilding && (
        <DeleteConfirmModal
          title="Delete Building"
          message={`Delete "${deleteBuilding.name}"? This will not delete the assets inside it.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteBuilding(null)}
        />
      )}
    </DashboardLayout>
  )
}
