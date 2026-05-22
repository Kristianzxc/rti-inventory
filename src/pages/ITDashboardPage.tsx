import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Cpu, Activity, Wrench, Archive, Building2, Clock, Monitor } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import StatCard from '@/components/dashboard/StatCard'
import { AssetGrowthChart, AssetsByBuildingChart, AssetStatusPieChart, MaintenanceTrendsChart } from '@/components/charts'
import { assetService } from '@/services'
import { formatDate, getStatusColor, getCategoryIcon } from '@/utils'
import { useAuth } from '@/features/auth/AuthContext'

export default function ITDashboardPage() {
  const { profile } = useAuth()

  const { data: stats } = useQuery({
    queryKey: ['it-dashboard-stats'],
    queryFn: () => assetService.getDashboardStats('it'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: buildingData = [] } = useQuery({
    queryKey: ['it-building-stats'],
    queryFn: () => assetService.getAssetsByBuilding('it'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: recentAssets = [] } = useQuery({
    queryKey: ['recent-it-assets'],
    queryFn: () => assetService.getRecentByDomain('it', 6),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: monthlyData = [] } = useQuery({
    queryKey: ['monthly-growth-it'],
    queryFn: () => assetService.getMonthlyGrowth('it'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: monitorCount } = useQuery({
    queryKey: ['it-monitor-count'],
    queryFn: async () => {
      const res = await assetService.getByDomain('it', { category: 'Monitors' }, 1, 1)
      return res?.count || 0
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const statusPie = [
    { name: 'Active',      value: stats?.activeAssets      || 0 },
    { name: 'Maintenance', value: stats?.maintenanceAssets || 0 },
    { name: 'Retired',     value: stats?.retiredAssets     || 0 },
    { name: 'Inactive',    value: Math.max(0, (stats?.totalAssets || 0) - (stats?.activeAssets || 0) - (stats?.maintenanceAssets || 0) - (stats?.retiredAssets || 0)) },
  ]

  const statCards = [
    { title: 'Total IT Assets',  value: stats?.totalAssets       ?? 0, icon: Cpu,       color: '#06b6d4', gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
    { title: 'Active',           value: stats?.activeAssets      ?? 0, icon: Activity,  color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#06b6d4)' },
    { title: 'In Maintenance',   value: stats?.maintenanceAssets ?? 0, icon: Wrench,    color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#f97316)' },
    { title: 'Retired',          value: stats?.retiredAssets     ?? 0, icon: Archive,   color: '#94a3b8', gradient: 'linear-gradient(135deg,#94a3b8,#64748b)' },
    { title: 'Buildings',        value: stats?.buildingsCount    ?? 0, icon: Building2, color: '#8b5cf6', gradient: 'linear-gradient(135deg,#8b5cf6,#ec4899)' },
    { title: 'Monitors',         value: monitorCount             ?? 0, icon: Monitor,   color: '#3b82f6', gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)' },
  ]

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
              <Cpu size={16} className="text-white" />
            </div>
            <h1 className="page-title">IT Dashboard</h1>
          </motion.div>
          <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
            className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {profile?.full_name?.split(' ')[0] || 'Admin'} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-sm font-medium text-cyan-400">IT Systems Online</span>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map((card, i) => <StatCard key={card.title} {...card} delay={i * 0.05} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <AssetGrowthChart data={monthlyData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <AssetsByBuildingChart data={buildingData} />
        </motion.div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <AssetStatusPieChart data={statusPie} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <MaintenanceTrendsChart data={monthlyData} />
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="glass-card overflow-hidden">
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: '#06b6d4' }} />
            <h3 className="section-title">Recently Added IT Assets</h3>
          </div>
          <a href="/assets" className="text-sm font-medium" style={{ color: '#06b6d4' }}>View all →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.5)' }}>
                {['Asset', 'Code', 'Category', 'Building', 'Status', 'Added'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentAssets.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No IT assets yet</td></tr>
              ) : recentAssets.map((asset: any, i: number) => (
                <tr key={i} className="table-row-hover" style={{ borderTop: '1px solid var(--border-subtle)' }}
                  onClick={() => window.location.href = `/assets/${asset.id}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: 'var(--bg-tertiary)' }}>
                        {getCategoryIcon(asset.category?.name || '')}
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{asset.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className="chip font-mono text-xs">{asset.asset_code || '—'}</span></td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{asset.category?.name || '—'}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{asset.building?.name || '—'}</td>
                  <td className="px-5 py-3"><span className={getStatusColor(asset.status)} style={{ textTransform: 'capitalize' }}>{asset.status}</span></td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{formatDate(asset.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </DashboardLayout>
  )
}