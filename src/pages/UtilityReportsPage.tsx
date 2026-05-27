import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { AssetsByBuildingChart, AssetStatusPieChart } from '@/components/charts'
import { assetService } from '@/services'
import { supabase } from '@/lib/supabase'

const CONDITION_COLORS: Record<string, string> = {
  'Working - Assigned':   '#10b981',
  'Working - In Storage': '#3b82f6',
  'For Testing':          '#f59e0b',
  'Not Tested':           '#94a3b8',
  'Defective':            '#f97316',
  'Damaged':              '#f43f5e',
  'For Disposal':         '#fca5a5',
}

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

  const { data: conditionCounts } = useQuery({
    queryKey: ['utility-condition-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('utility_asset_extras').select('utility_condition')
      if (!data) return {}
      const counts: Record<string, number> = {}
      data.forEach((r: any) => {
        if (r.utility_condition) counts[r.utility_condition] = (counts[r.utility_condition] || 0) + 1
      })
      return counts
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const conditionPie = Object.entries(conditionCounts || {})
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  const total = stats?.totalAssets ?? 0
  const working = (conditionCounts?.['Working - Assigned'] || 0) + (conditionCounts?.['Working - In Storage'] || 0)
  const damaged = (conditionCounts?.['Damaged'] || 0) + (conditionCounts?.['Defective'] || 0)
  const forDisp = conditionCounts?.['For Disposal'] || 0

  const summaryCards = [
    { label: 'Total Items',       value: total,                          color: '#10b981' },
    { label: 'Working',           value: working,                        color: '#3b82f6' },
    { label: 'Damaged / Defective', value: damaged,                      color: '#f43f5e' },
    { label: 'For Disposal',      value: forDisp,                        color: '#94a3b8' },
    { label: 'Buildings Covered', value: stats?.buildingsCount ?? 0,     color: '#8b5cf6' },
    { label: 'In Maintenance',    value: stats?.maintenanceAssets ?? 0,  color: '#f59e0b' },
  ]

  return (
    <DashboardLayout title="Utility Reports">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Utility Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Reports for utility and facility items
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} className="glass-card p-4">
            <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'Barlow, sans-serif' }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <AssetsByBuildingChart data={buildingData} />
        </motion.div>
        {conditionPie.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <AssetStatusPieChart data={conditionPie} />
          </motion.div>
        )}
      </div>

      {/* Condition breakdown table */}
      {conditionCounts && Object.keys(conditionCounts).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card p-5">
          <h3 className="section-title mb-4">Condition Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(conditionCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([condition, count]) => {
                const color = CONDITION_COLORS[condition] || '#94a3b8'
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={condition}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{condition}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                        <span className="text-xs w-10 text-right font-bold" style={{ color }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  )
}