import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Shield, Layers, Lock, Mail, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
})
type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) throw error

      // Fetch the user's role to redirect correctly
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      toast.success('Welcome back!')

      // Role-aware redirect
      if (profile?.role === 'utility-admin') {
        navigate('/utility-dashboard', { replace: true })
      } else {
        // tech-admin and it-admin both go to IT dashboard
        navigate('/dashboard', { replace: true })
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--gradient-brand)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--accent-cyan)' }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: 'var(--gradient-brand)', boxShadow: 'var(--shadow-glow)' }}>
              <Layers size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold gradient-text">AssetVault</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Enterprise Asset Management System
            </p>
          </div>

          {/* Card */}
          <div className="glass-card p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Sign in to your account
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Access is role-based — you'll be directed to your dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="label-text block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }} />
                  <input {...register('email')} type="email"
                    className="input-field pl-10" placeholder="you@company.com" />
                </div>
                {errors.email && <p className="text-xs mt-1 text-rose-400">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="label-text block mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }} />
                  <input {...register('password')} type={showPassword ? 'text' : 'password'}
                    className="input-field pl-10 pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs mt-1 text-rose-400">{errors.password.message}</p>}
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...register('remember')} type="checkbox"
                    className="w-4 h-4 rounded accent-blue-500" />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Remember me</span>
                </label>
                <Link to="/forgot-password"
                  className="text-sm font-medium transition-colors hover:text-blue-400"
                  style={{ color: 'var(--accent-blue)' }}>
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>Sign In</span><ArrowRight size={16} /></>
                }
              </button>
            </form>

            {/* Role hints */}
            <div className="mt-5 pt-5 space-y-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Role-based access
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'Tech Admin',    color: '#3b82f6', dot: 'bg-blue-400' },
                  { role: 'IT Admin',      color: '#06b6d4', dot: 'bg-cyan-400' },
                  { role: 'Utility Admin', color: '#10b981', dot: 'bg-emerald-400' },
                ].map(r => (
                  <div key={r.role} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                    style={{ background: 'var(--bg-secondary)' }}>
                    <div className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <Shield size={13} style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Secured with Supabase Auth — All data encrypted in transit
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
