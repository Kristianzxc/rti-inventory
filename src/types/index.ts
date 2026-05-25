export type UserRole = 'tech-admin' | 'it-admin' | 'utility-admin'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  department: string | null
  email: string | null
  created_at: string
}

export interface Building {
  id: string
  name: string
  description: string | null
  floors: number | null
  created_at: string
}

export interface AssetCategory {
  id: string
  name: string
  type: string | null
  icon: string | null
  created_at: string
}

export type AssetStatus = 'active' | 'defective' | 'maintenance' | 'disposed'
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor'
export type AssetDomain = 'it' | 'utility'

export interface Asset {
  id: string
  asset_code: string | null
  name: string
  description: string | null
  category_id: string | null
  building_id: string | null
  floor_room: string | null
  serial_number: string | null
  status: AssetStatus
  condition: AssetCondition
  domain: AssetDomain
  image_url: string | null
  assigned_to: string | null
  purchase_date: string | null
  maintenance_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  category?: AssetCategory
  building?: Building
  creator?: Profile
}

export interface MaintenanceLog {
  id: string
  asset_id: string
  notes: string | null
  maintenance_date: string
  performed_by: string | null
  status: string | null
  cost: number | null
  created_at: string
  asset?: Asset
  performer?: Profile
}

export interface AssetFormData {
  name: string
  description: string
  category_id: string
  building_id: string
  asset_code: string
  serial_number: string
  status: AssetStatus
  condition: AssetCondition
  assigned_to: string
  purchase_date: string
  maintenance_date: string
  domain: AssetDomain
}

export interface DashboardStats {
  totalAssets: number
  activeAssets: number
  maintenanceAssets: number
  disposedAssets: number
  buildingsCount: number
}

export type ReceivedItemCondition = 'new' | 'recycle' | 'good_as_new' | 'used'

export interface ReceivedItem {
  id: string
  date_received: string
  item: string
  quantity: number
  unit: string
  condition: ReceivedItemCondition
  delivered_by: string | null
  received_by: string | null
  temporary_building_storage: string | null
  assigned_transferred_to: string | null
  transferred_by: string | null
  date_transferred: string | null
  asset_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  asset?: Asset
}

export interface ChartDataPoint {
  month: string
  count: number
}

export interface FilterState {
  search: string
  building: string
  category: string
  status: string
  condition: string
  dateFrom: string
  dateTo: string
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

// IT asset category names
export const IT_CATEGORIES = [
  'PC Sets', 'Laptops', 'Servers', 'Monitors',
  'Networking Devices', 'Printers', 'CCTV', 'Laboratory Equipment',
]

// Utility asset category names
export const UTILITY_CATEGORIES = [
  'Chairs', 'Tables', 'Stand Fans', 'Cabinets',
  'Whiteboards', 'Air Conditioners', 'Projectors',
]