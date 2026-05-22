import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Layers, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
      toast.success('Reset link sent! Check your email.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--gradient-brand)' }} />
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: 'var(--gradient-brand)', boxShadow: 'var(--shadow-glow)' }}>
              <Layers size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold gradient-text">AssetVault</h1>
          </div>

          <div className="glass-card p-8">
            {sent ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <CheckCircle size={28} className="text-emerald-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Email Sent!</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  We've sent a password reset link to <strong>{email}</strong>. Check your inbox.
                </p>
                <Link to="/login" className="btn-primary w-full justify-center">
                  Back to Login
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Reset Password</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Enter your email and we'll send you a reset link
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label-text block mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-muted)' }} />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        className="input-field pl-10" placeholder="admin@company.com" required />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Send Reset Link'}
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="text-center mt-5">
            <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm transition-colors hover:text-blue-400"
              style={{ color: 'var(--text-secondary)' }}>
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
