import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface DeleteConfirmModalProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function DeleteConfirmModal({ title, message, onConfirm, onCancel, loading }: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
        onClick={(e) => e.target === e.currentTarget && onCancel()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-sm glass-card p-6"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)' }}>
              <AlertTriangle size={18} className="text-rose-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{message}</p>
            </div>
            <button onClick={onCancel} className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button onClick={onCancel} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="btn-danger py-2 px-4 text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
              ) : 'Delete'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
