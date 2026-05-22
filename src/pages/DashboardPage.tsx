import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Package, Activity, Wrench, Archive, Building2, Zap, Clock, TrendingUp } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import StatCard from '@/components/dashboard/StatCard'
import {
  AssetGrowthChart, AssetsByBuildingChart,
  AssetStatusPieChart, MaintenanceTrendsChart
} from '@/components/charts'
import { assetService } from '@/services'
import { formatDate, getStatusColor, getCategoryIcon } from '@/utils'
import { useAuth } from '@/features/auth/AuthContext'

export default function DashboardPage() {
  const { profile } = useAuth()

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => assetService.getDashboardStats(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: itStats } = useQuery({
    queryKey: ['dashboard-stats-it'],
    queryFn: () => assetService.getDashboardStats('it'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: utilityStats } = useQuery({
    queryKey: ['dashboard-stats-utility'],
    queryFn: () => assetService.getDashboardStats('utility'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: recentAssets = [] } = useQuery({
    queryKey: ['recent-assets'],
    queryFn: () => assetService.getRecentAssets(6),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: monthlyData = [] } = useQuery({
    queryKey: ['monthly-growth'],
    queryFn: () => assetService.getMonthlyGrowth(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: buildingData = [] } = useQuery({
    queryKey: ['building-stats-all'],
    queryFn: () => assetService.getAssetsByBuilding(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: maintenanceData = [] } = useQuery({
    queryKey: ['monthly-growth-maintenance'],
    queryFn: () => assetService.getMonthlyGrowth(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const statusPieData = [
    { name: 'Active',      value: stats?.activeAssets      || 0 },
    { name: 'Maintenance', value: stats?.maintenanceAssets || 0 },
    { name: 'Retired',     value: stats?.retiredAssets     || 0 },
    { name: 'Inactive',    value: Math.max(0, (stats?.totalAssets || 0) - (stats?.activeAssets || 0) - (stats?.maintenanceAssets || 0) - (stats?.retiredAssets || 0)) },
  ]

  const statCards = [
    { title: 'Total Assets',    value: stats?.totalAssets       ?? 0, icon: Package,   color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', change: undefined },
    { title: 'Active Assets',   value: stats?.activeAssets      ?? 0, icon: Activity,  color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #06b6d4)', change: undefined },
    { title: 'In Maintenance',  value: stats?.maintenanceAssets ?? 0, icon: Wrench,    color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', change: undefined },
    { title: 'Retired',         value: stats?.retiredAssets     ?? 0, icon: Archive,   color: '#94a3b8', gradient: 'linear-gradient(135deg, #94a3b8, #64748b)', change: undefined },
    { title: 'IT Assets',       value: itStats?.totalAssets     ?? 0, icon: Building2, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)', change: undefined },
    { title: 'Utility Assets',  value: utilityStats?.totalAssets?? 0, icon: Zap,       color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)', change: undefined },
  ]

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="page-title">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},{' '}
            <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'Admin'}</span> 👋
          </motion.h1>
          <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium text-emerald-400">System Online</span>
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
          <AssetStatusPieChart data={statusPieData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <MaintenanceTrendsChart data={maintenanceData} />
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="glass-card overflow-hidden">
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Clock size={18} style={{ color: 'var(--accent-blue)' }} />
            <h3 className="section-title">Recently Added Assets</h3>
          </div>
          <a href="/assets" className="text-sm font-medium" style={{ color: 'var(--accent-blue)' }}>View all →</a>
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
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No assets yet</td></tr>
              ) : recentAssets.map((asset: any, i: number) => (
                <tr key={asset.id || i} className="table-row-hover" style={{ borderTop: '1px solid var(--border-subtle)' }}
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="glass-card p-5 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} style={{ color: 'var(--accent-blue)' }} />
          <h3 className="section-title">Domain Overview</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#06b6d4' }}>IT Assets</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total',       value: itStats?.totalAssets       ?? 0 },
                { label: 'Active',      value: itStats?.activeAssets      ?? 0 },
                { label: 'Maintenance', value: itStats?.maintenanceAssets ?? 0 },
                { label: 'Retired',     value: itStats?.retiredAssets     ?? 0 },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Barlow, sans-serif' }}>{s.value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#10b981' }}>Utility Assets</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total',       value: utilityStats?.totalAssets       ?? 0 },
                { label: 'Active',      value: utilityStats?.activeAssets      ?? 0 },
                { label: 'Maintenance', value: utilityStats?.maintenanceAssets ?? 0 },
                { label: 'Retired',     value: utilityStats?.retiredAssets     ?? 0 },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Barlow, sans-serif' }}>{s.value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  )
}