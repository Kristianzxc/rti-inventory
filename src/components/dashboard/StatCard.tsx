import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  color: string
  gradient: string
  change?: number
  subtitle?: string
  delay?: number
}

export default function StatCard({ title, value, icon: Icon, color, gradient, change, subtitle, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="stat-card relative overflow-hidden group cursor-default"
    >
      {/* Background glow */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl"
        style={{ background: gradient }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
          <p className="text-3xl font-display font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          )}
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span>{change >= 0 ? '↑' : '↓'} {Math.abs(change)}%</span>
              <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
            </div>
          )}
        </div>

        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: gradient, boxShadow: `0 4px 12px ${color}40` }}
        >
          <Icon size={20} className="text-white" />
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-full"
        style={{ background: gradient }} />
    </motion.div>
  )
}
