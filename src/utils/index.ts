import type { AssetStatus, AssetCondition } from '@/types'

export function formatDate(dateStr: string | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

export function getStatusColor(status: AssetStatus) {
  const colors: Record<AssetStatus, string> = {
    active: 'badge-active',
    defective: 'badge-inactive',
    maintenance: 'badge-maintenance',
    disposed: 'badge-retired',
  }
  return colors[status] || 'badge-inactive'
}

export function getConditionColor(condition: AssetCondition) {
  const colors: Record<AssetCondition, string> = {
    excellent: 'text-emerald-400',
    good: 'text-blue-400',
    fair: 'text-amber-400',
    poor: 'text-rose-400',
  }
  return colors[condition] || 'text-slate-400'
}

export function getConditionBadge(condition: AssetCondition) {
  const styles: Record<AssetCondition, string> = {
    excellent: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    good: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    fair: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    poor: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  }
  return styles[condition] || ''
}

export function getCategoryIcon(categoryName: string): string {
  const icons: Record<string, string> = {
    'PC Sets': '🖥️',
    'Laptops': '💻',
    'Servers': '🗄️',
    'Networking Devices': '🌐',
    'Printers': '🖨️',
    'CCTV': '📷',
    'Chairs': '🪑',
    'Tables': '🪵',
    'Stand Fans': '💨',
    'Cabinets': '🗃️',
    'Whiteboards': '📋',
    'Projectors': '📽️',
    'Air Conditioners': '❄️',
    'Monitors': '🖥️',
    'Laboratory Equipment': '🔬',
  }
  return icons[categoryName] || '📦'
}

export function generateAssetCode() {
  const prefix = 'AST'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).slice(2, 4).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const ASSET_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'defective', label: 'Defective' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'disposed', label: 'Disposed' },
]

export const ASSET_CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

export const CATEGORY_TYPES = [
  'Technology',
  'Utility',
  'Building',
  'Office Equipment',
  'Laboratory',
  'Security',
]