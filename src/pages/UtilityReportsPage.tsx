import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Armchair, Building2 } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { AssetsByBuildingChart, AssetStatusPieChart } from '@/components/charts'
import { assetService } from '@/services'

export default function UtilityReportsPage() {
  const { data: stats } = useQuery({
    queryKey: ['utility-dashboard-stats'],
    queryFn: () => assetService.getDashboardStats('utility'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: buildingData = [] } = useQuery({
    queryKey: ['utility-building-stats'],
    queryFn: () => assetService.getAssetsByBuilding('utility'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const statusData = [
    { name: 'Active',      value: stats?.activeAssets      || 0 },
    { name: 'Maintenance', value: stats?.maintenanceAssets || 0 },
    { name: 'Retired',     value: stats?.retiredAssets     || 0 },
    { name: 'Inactive',    value: Math.max(0, (stats?.totalAssets || 0) - (stats?.activeAssets || 0) - (stats?.maintenanceAssets || 0) - (stats?.retiredAssets || 0)) },
  ]

  const summaryCards = [
    { label: 'Total Utility Assets', value: stats?.totalAssets       ?? 0, icon: Armchair,  color: '#10b981' },
    { label: 'Active',               value: stats?.activeAssets      ?? 0, icon: Armchair,  color: '#3b82f6' },
    { label: 'In Maintenance',       value: stats?.maintenanceAssets ?? 0, icon: Armchair,  color: '#f59e0b' },
    { label: 'Buildings Covered',    value: stats?.buildingsCount    ?? 0, icon: Building2, color: '#8b5cf6' },
  ]

  return (
    <DashboardLayout title="Utility Reports">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Utility Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Reports for utility and facility assets
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} className="glass-card p-4">
            <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'Barlow, sans-serif' }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <AssetsByBuildingChart data={buildingData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <AssetStatusPieChart data={statusData} />
        </motion.div>
      </div>
    </DashboardLayout>
  )
}