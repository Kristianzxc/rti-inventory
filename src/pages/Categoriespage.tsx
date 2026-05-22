import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Tag, Plus, Pencil, Trash2, X, Cpu, Armchair } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'
import { categoryService } from '@/services'
import { useAuth } from '@/features/auth/AuthContext'
import { toast } from 'sonner'

const ICONS = ['💻','🖥️','🖨️','🌐','📱','🔌','⚡','💡','🪑','🛋️','❄️','🌬️','🔧','📦','🖱️','⌨️','📷','📺','🔒','📡']

export default function CategoriesPage() {
  const qc = useQueryClient()
  const { isAdmin, isITAdmin, isUtility } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editCat, setEditCat] = useState<any>(null)
  const [deleteCat, setDeleteCat] = useState<any>(null)
  // Default tab based on role; non-admin roles only see their domain
  const [activeTab, setActiveTab] = useState<'it' | 'utility'>(isUtility ? 'utility' : 'it')
  const [form, setForm] = useState({ name: '', type: 'it', icon: '📦' })

  const { data: allCategories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const itCats      = allCategories.filter((c: any) => c.type === 'it')
  const utilityCats = allCategories.filter((c: any) => c.type === 'utility')

  // Non-admin roles always see their own domain regardless of activeTab
  const displayed = isUtility && !isAdmin
    ? utilityCats
    : isITAdmin && !isAdmin
    ? itCats
    : activeTab === 'it' ? itCats : utilityCats

  const openAdd = () => {
    setEditCat(null)
    setForm({ name: '', type: activeTab, icon: '📦' })
    setShowModal(true)
  }

  const openEdit = (cat: any) => {
    setEditCat(cat)
    setForm({ name: cat.name, type: cat.type, icon: cat.icon || '📦' })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editCat) {
        await categoryService.update(editCat.id, form)
        toast.success('Category updated')
      } else {
        await categoryService.create(form)
        toast.success('Category created')
      }
      await qc.invalidateQueries({ queryKey: ['categories'] })
      setShowModal(false)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save category')
    }
  }

  const handleDelete = async () => {
    try {
      await categoryService.delete(deleteCat.id)
      toast.success('Category deleted')
      await qc.invalidateQueries({ queryKey: ['categories'] })
      setDeleteCat(null)
    } catch {
      toast.error('Failed to delete — category may be in use by assets')
    }
  }

  return (
    <DashboardLayout title="Categories">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Asset Categories</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {isAdmin
              ? `${itCats.length} IT · ${utilityCats.length} Utility categories`
              : isUtility
              ? `${utilityCats.length} Utility categories`
              : `${itCats.length} IT categories`}
          </p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary">
            <Plus size={15} /> Add Category
          </button>
        )}
      </div>

      {/* Tabs — only tech-admin sees both; IT-admin sees IT only, Utility-admin sees Utility only */}
      {isAdmin && (
        <div className="flex items-center gap-1 p-1 rounded-xl mb-5 w-fit"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          {[
            { key: 'it',      label: 'IT Categories',      icon: Cpu,      color: '#06b6d4' },
            { key: 'utility', label: 'Utility Categories', icon: Armchair, color: '#10b981' },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.key ? 'var(--bg-primary)' : 'transparent',
                color: activeTab === tab.key ? tab.color : 'var(--text-muted)',
                boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
              }}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Role label for non-admin users */}
      {!isAdmin && (
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: isUtility ? 'rgba(16,185,129,0.1)' : 'rgba(6,182,212,0.1)',
              color: isUtility ? '#10b981' : '#06b6d4',
              border: `1px solid ${isUtility ? 'rgba(16,185,129,0.25)' : 'rgba(6,182,212,0.25)'}`,
            }}>
            {isUtility ? <Armchair size={14} /> : <Cpu size={14} />}
            {isUtility ? 'Utility Categories' : 'IT Categories'}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Tag size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No {activeTab === 'it' ? 'IT' : 'Utility'} categories yet.
            {isAdmin && ' Click "Add Category" to create one.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayed.map((cat: any, i: number) => (
            <motion.div key={cat.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass-card p-4 group relative">
              <div className="flex items-start justify-between">
                <div className="text-3xl mb-3 select-none">{cat.icon || '📦'}</div>
                {isAdmin && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-500/20 transition-colors"
                      style={{ color: 'var(--text-muted)' }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteCat(cat)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-500/20 transition-colors text-rose-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{cat.name}</p>
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: cat.type === 'it' ? 'rgba(6,182,212,0.1)' : 'rgba(16,185,129,0.1)',
                  color:       cat.type === 'it' ? '#06b6d4' : '#10b981',
                }}>
                {cat.type === 'it' ? 'IT' : 'Utility'}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">{editCat ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text block mb-1.5">Category Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field" placeholder="e.g. Laptops, Stand Fans..." required />
              </div>
              <div>
                <label className="label-text block mb-1.5">Domain</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="select-field">
                  <option value="it">IT</option>
                  <option value="utility">Utility</option>
                </select>
              </div>
              <div>
                <label className="label-text block mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon => (
                    <button key={icon} type="button"
                      onClick={() => setForm(f => ({ ...f, icon }))}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all"
                      style={{
                        background: form.icon === icon ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                        border: form.icon === icon ? '2px solid var(--accent-blue)' : '2px solid transparent',
                        transform: form.icon === icon ? 'scale(1.1)' : 'scale(1)',
                      }}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editCat ? 'Save Changes' : 'Add Category'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {deleteCat && (
        <DeleteConfirmModal
          title="Delete Category"
          message={`Delete "${deleteCat.name}"? Assets using this category will lose their category assignment.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteCat(null)}
        />
      )}
    </DashboardLayout>
  )
}