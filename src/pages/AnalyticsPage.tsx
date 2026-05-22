import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import {
  AssetGrowthChart, AssetsByBuildingChart,
  AssetStatusPieChart, MaintenanceTrendsChart
} from '@/components/charts'
import { assetService, categoryService } from '@/services'

export default function AnalyticsPage() {
  const { data: monthly = [] } = useQuery({
    queryKey: ['monthly-growth'],
    queryFn: () => assetService.getMonthlyGrowth(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: buildings = [] } = useQuery({
    queryKey: ['building-stats-all'],
    queryFn: () => assetService.getAssetsByBuilding(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => assetService.getDashboardStats(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: maintenanceMonthly = [] } = useQuery({
    queryKey: ['monthly-growth-maintenance'],
    queryFn: () => assetService.getMonthlyGrowth(),
    staleTime: 0,
  })

  const { data: allAssetsData } = useQuery({
    queryKey: ['all-assets-for-analytics'],
    queryFn: () => assetService.getAll({}, 1, 9999),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
    staleTime: 0,
  })

  const allAssets = allAssetsData?.data || []
  const total = stats?.totalAssets || 0

  // Build real category breakdown from actual assets
  const categoryBreakdown = categories.map((cat: any) => {
    const count = allAssets.filter((a: any) => a.category?.name === cat.name || a.category_id === cat.id).length
    return { name: cat.name, count, pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0 }
  }).filter((c: any) => c.count > 0)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 8)

  const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#f43f5e','#94a3b8','#ec4899']

  const statusPie = [
    { name: 'Active',      value: stats?.activeAssets      || 0 },
    { name: 'Maintenance', value: stats?.maintenanceAssets || 0 },
    { name: 'Retired',     value: stats?.retiredAssets     || 0 },
    { name: 'Inactive',    value: Math.max(0, total - (stats?.activeAssets || 0) - (stats?.maintenanceAssets || 0) - (stats?.retiredAssets || 0)) },
  ]

  const utilRate = total > 0 ? ((stats?.activeAssets || 0) / total * 100).toFixed(1) : '0.0'
  const maintRate = total > 0 ? ((stats?.maintenanceAssets || 0) / total * 100).toFixed(1) : '0.0'
  const retireRate = total > 0 ? ((stats?.retiredAssets || 0) / total * 100).toFixed(1) : '0.0'

  const kpis = [
    { label: 'Asset Utilization', value: `${utilRate}%`,  icon: Activity,  color: '#3b82f6' },
    { label: 'Maintenance Rate',  value: `${maintRate}%`, icon: TrendingUp, color: '#f59e0b' },
    { label: 'Total Assets',      value: `${total}`,       icon: BarChart3,  color: '#8b5cf6' },
    { label: 'Retirement Rate',   value: `${retireRate}%`,icon: PieChart,   color: '#10b981' },
  ]

  return (
    <DashboardLayout title="Analytics">
      <div className="mb-6">
        <h1 className="page-title">Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Deep insights into your asset inventory
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {kpi.label}
              </span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}20` }}>
                <kpi.icon size={14} style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Barlow, sans-serif' }}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <AssetGrowthChart data={monthly} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <AssetsByBuildingChart data={buildings} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <AssetStatusPieChart data={statusPie} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <MaintenanceTrendsChart data={maintenanceMonthly} />
        </motion.div>
      </div>

      {categoryBreakdown.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glass-card p-5 mt-4">
          <h3 className="section-title mb-5">Asset Category Breakdown</h3>
          <div className="space-y-3">
            {categoryBreakdown.map((cat: any, idx: number) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cat.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cat.count}</span>
                    <span className="text-xs w-12 text-right font-semibold" style={{ color: COLORS[idx % COLORS.length] }}>{cat.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.pct}%` }}
                    transition={{ duration: 1, delay: 0.5 + idx * 0.05, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: COLORS[idx % COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  )
}