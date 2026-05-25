import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileText, Download, FileSpreadsheet, Filter, Building2, Tag, Activity } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { assetService, buildingService, categoryService } from '@/services'
import { formatDate, downloadBlob } from '@/utils'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null)
  const [reportType, setReportType] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: assetsData } = useQuery({
    queryKey: ['assets-report'],
    queryFn: () => assetService.getAll({}, 1, 999),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: buildingsList = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingService.getAll(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const { data: categoriesList = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  const assets = assetsData?.data || []

  const handleExportExcel = async () => {
    setGenerating('excel')
    try {
      const rows = assets.map((a: any) => ({
        'Asset Code': a.asset_code || a.code || '',
        'Asset Name': a.name,
        'Category': a.category?.name || a.categoryName || '',
        'Building': a.building?.name || a.buildingName || '',
        'Floor/Room': a.floor_room || a.floorRoom || '',
        'Serial Number': a.serial_number || '',
        'Status': a.status,
        'Condition': a.condition || '',
        'Assigned To': a.assigned_to || a.assignedTo || '',
        'Purchase Date': formatDate(a.purchase_date),
        'Added On': formatDate(a.created_at),
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)

      // Column widths
      ws['!cols'] = [
        { wch: 14 }, { wch: 30 }, { wch: 20 }, { wch: 15 },
        { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
        { wch: 20 }, { wch: 14 }, { wch: 14 },
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Assets')
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([buffer], { type: 'application/octet-stream' })
      downloadBlob(blob, `asset-report-${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Excel report exported!')
    } catch {
      toast.error('Failed to export Excel')
    } finally {
      setGenerating(null)
    }
  }

  const handleExportPDF = async () => {
    setGenerating('pdf')
    try {
      const { default: jsPDF } = await import('jspdf')
      // @ts-ignore — jspdf-autotable ships its own types inside the package
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'landscape' })

      // Header
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F')
      doc.setTextColor(241, 245, 249)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('AssetVault — Asset Inventory Report', 14, 18)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      doc.text(`Generated: ${new Date().toLocaleString()}  |  Total: ${assets.length} assets`, 14, 28)

      const rows = assets.map((a: any) => [
        a.asset_code || '',
        a.name,
        a.category?.name || a.categoryName || '—',
        a.building?.name || a.buildingName || '—',
        a.status,
        a.condition || '—',
        a.assigned_to || a.assignedTo || '—',
        formatDate(a.created_at),
      ])

      autoTable(doc, {
        startY: 40,
        head: [['Code', 'Name', 'Category', 'Building', 'Status', 'Condition', 'Assigned To', 'Added']],
        body: rows,
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [148, 163, 184],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [71, 85, 105],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        styles: {
          cellPadding: 4,
        },
      })

      doc.save(`asset-report-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF report exported!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to export PDF')
    } finally {
      setGenerating(null)
    }
  }

  const summaryCards = [
    { title: 'Total Assets', value: assets.length, icon: Tag, color: '#3b82f6' },
    { title: 'Active', value: assets.filter((a: any) => a.status === 'active').length, icon: Activity, color: '#10b981' },
    { title: 'Buildings', value: buildingsList.length, icon: Building2, color: '#8b5cf6' },
    { title: 'Categories', value: categoriesList.length, icon: Filter, color: '#f59e0b' },
  ]

  return (
    <DashboardLayout title="Reports">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Generate and export asset reports
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${card.color}20`, border: `1px solid ${card.color}40` }}>
              <card.icon size={18} style={{ color: card.color }} />
            </div>
            <div>
              <p className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{card.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Export options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <FileSpreadsheet size={22} className="text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Excel Report</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Export all assets as a formatted Excel spreadsheet (.xlsx)
            </p>
            <button
              onClick={handleExportExcel}
              disabled={generating === 'excel'}
              className="btn-secondary mt-3 text-sm py-2"
            >
              {generating === 'excel' ? (
                <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
              ) : <Download size={14} />}
              Export Excel
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6 flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)' }}>
            <FileText size={22} className="text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>PDF Report</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Generate a formatted PDF report with summary and asset table
            </p>
            <button
              onClick={handleExportPDF}
              disabled={generating === 'pdf'}
              className="btn-secondary mt-3 text-sm py-2"
            >
              {generating === 'pdf' ? (
                <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
              ) : <Download size={14} />}
              Export PDF
            </button>
          </div>
        </motion.div>
      </div>

      {/* Preview table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="section-title">Report Preview</h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Showing {assets.length} assets</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.5)' }}>
                {['Code', 'Name', 'Category', 'Building', 'Status', 'Condition', 'Added'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.slice(0, 8).map((asset: any, i: number) => (
                <tr key={i} className="table-row-hover" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td className="px-5 py-3 text-xs font-mono" style={{ color: 'var(--accent-blue)' }}>
                    {asset.asset_code || asset.code}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{asset.name}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{asset.category?.name || asset.categoryName || '—'}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{asset.building?.name || asset.buildingName || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`badge badge-${asset.status}`} style={{ textTransform: 'capitalize' }}>{asset.status}</span>
                  </td>
                  <td className="px-5 py-3 text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>{asset.condition || '—'}</td>
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