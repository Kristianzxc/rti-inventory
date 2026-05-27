import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Armchair, Wrench, Archive, Building2, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import StatCard from '@/components/dashboard/StatCard'
import { AssetsByBuildingChart, AssetStatusPieChart, AssetGrowthChart } from '@/components/charts'
import { assetService } from '@/services'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils'
import { useAuth } from '@/features/auth/AuthContext'

/* ── Condition badge (same palette as assets page) ─────────── */
function ConditionBadge({ value }: { value: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'Working - Assigned':   { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
    'Working - In Storage': { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
    'For Testing':          { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
    'Not Tested':           { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
    'Defective':            { bg: 'rgba(249,115,22,0.15)',  color: '#f97316' },
    'Damaged':              { bg: 'rgba(244,63,94,0.15)',   color: '#f43f5e' },
    'For Disposal':         { bg: 'rgba(127,29,29,0.25)',   color: '#fca5a5' },
  }
  const style = map[value] || { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' }
  if (!value) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap" style={style}>
      {value}
    </span>
  )
}

export default function UtilityDashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ['utility-dashboard-stats'],
    queryFn: () => assetService.getDashboardStats('utility'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: recentItems = [] } = useQuery({
    queryKey: ['recent-utility-assets'],
    queryFn: () => assetService.getRecentByDomain('utility', 6),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  // Fetch extras for recent items to get condition, location, workstation
  const recentIds = recentItems.map((a: any) => a.id)
  const { data: recentExtras = [] } = useQuery({
    queryKey: ['recent-utility-extras', recentIds.join(',')],
    queryFn: async () => {
      if (!recentIds.length) return []
      const { data } = await supabase
        .from('utility_asset_extras')
        .select('*')
        .in('asset_id', recentIds)
      return data || []
    },
    enabled: recentIds.length > 0,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const extrasMap: Record<string, any> = {}
  recentExtras.forEach((e: any) => { extrasMap[e.asset_id] = e })

  const { data: buildingData = [] } = useQuery({
    queryKey: ['utility-building-stats'],
    queryFn: () => assetService.getAssetsByBuilding('utility'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: monthlyData = [] } = useQuery({
    queryKey: ['monthly-growth-utility'],
    queryFn: () => assetService.getMonthlyGrowth('utility'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: conditionCounts } = useQuery({
    queryKey: ['utility-condition-counts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('utility_asset_extras')
        .select('utility_condition')
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

  const working   = (conditionCounts?.['Working - Assigned'] || 0) + (conditionCounts?.['Working - In Storage'] || 0)
  const damaged   = (conditionCounts?.['Damaged'] || 0) + (conditionCounts?.['Defective'] || 0)
  const forDisp   = conditionCounts?.['For Disposal'] || 0

  const statusPie = [
    { name: 'Working - Assigned',   value: conditionCounts?.['Working - Assigned']   || 0 },
    { name: 'Working - In Storage', value: conditionCounts?.['Working - In Storage'] || 0 },
    { name: 'For Testing',          value: conditionCounts?.['For Testing']          || 0 },
    { name: 'Not Tested',           value: conditionCounts?.['Not Tested']           || 0 },
    { name: 'Defective',            value: conditionCounts?.['Defective']            || 0 },
    { name: 'Damaged',              value: conditionCounts?.['Damaged']              || 0 },
    { name: 'For Disposal',         value: conditionCounts?.['For Disposal']         || 0 },
  ].filter(s => s.value > 0)

  const statCards = [
    { title: 'Total Items',       value: stats?.totalAssets    ?? 0, icon: Armchair,      color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#06b6d4)' },
    { title: 'Working',           value: working,                    icon: CheckCircle,   color: '#3b82f6', gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)' },
    { title: 'In Maintenance',    value: stats?.maintenanceAssets ?? 0, icon: Wrench,     color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#f97316)' },
    { title: 'Damaged/Defective', value: damaged,                    icon: AlertTriangle, color: '#ef4444', gradient: 'linear-gradient(135deg,#ef4444,#f97316)' },
    { title: 'Buildings',         value: stats?.buildingsCount ?? 0, icon: Building2,     color: '#8b5cf6', gradient: 'linear-gradient(135deg,#8b5cf6,#ec4899)' },
    { title: 'For Disposal',      value: forDisp,                    icon: Archive,       color: '#94a3b8', gradient: 'linear-gradient(135deg,#94a3b8,#64748b)' },
  ]

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
              <Armchair size={16} className="text-white" />
            </div>
            <h1 className="page-title">Utility Dashboard</h1>
          </motion.div>
          <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
            className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {profile?.full_name?.split(' ')[0] || 'Admin'} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium text-emerald-400">Utility Online</span>
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

      {statusPie.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <AssetStatusPieChart data={statusPie} />
          </motion.div>
        </div>
      )}

      {/* Recent Items — updated columns */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="glass-card overflow-hidden">
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: '#10b981' }} />
            <h3 className="section-title">Recently Added Items</h3>
          </div>
          <a href="/utility-assets" className="text-sm font-medium" style={{ color: '#10b981' }}>View all →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.5)' }}>
                {['Item Model', 'Stock ID', 'Item Type', 'Condition', 'Location of Item', 'Work Station', 'Added'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentItems.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No utility items yet</td></tr>
              ) : recentItems.map((item: any, i: number) => {
                const extra = extrasMap[item.id] || {}
                return (
                  <tr key={i} className="table-row-hover cursor-pointer" style={{ borderTop: '1px solid var(--border-subtle)' }}
                    onClick={() => navigate(`/assets/${item.id}`)}>
                    {/* Item Model */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        {item.image_url
                          ? <img src={item.image_url} alt={item.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          : <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                              style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                              {item.name?.[0]?.toUpperCase() || '?'}
                            </div>
                        }
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                      </div>
                    </td>
                    {/* Stock ID */}
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--bg-tertiary)', color: '#60a5fa' }}>
                        {item.asset_code || '—'}
                      </span>
                    </td>
                    {/* Item Type */}
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{item.category?.name || '—'}</td>
                    {/* Condition */}
                    <td className="px-5 py-3"><ConditionBadge value={extra.utility_condition || ''} /></td>
                    {/* Location of Item */}
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{item.assigned_to || '—'}</td>
                    {/* Work Station */}
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{extra.workstation || '—'}</td>
                    {/* Added */}
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{formatDate(item.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </DashboardLayout>
  )
}