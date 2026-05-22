import { supabase } from '@/lib/supabase'
import type { Asset, AssetCategory, AssetDomain, FilterState, MaintenanceLog, Profile } from '@/types'

export const assetService = {
  async getAll(filters?: Partial<FilterState>, page = 1, pageSize = 10) {
    let q = supabase
      .from('assets')
      .select('*, category:asset_categories(id,name,type,icon), building:buildings(id,name)', { count:'exact' })
      .order('created_at', { ascending: false })
    if (filters?.search)    q = q.or(`name.ilike.%${filters.search}%,asset_code.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%,assigned_to.ilike.%${filters.search}%`)
    if (filters?.status)    q = q.eq('status',      filters.status)
    if (filters?.building)  q = q.eq('building_id', filters.building)
    if (filters?.category)  q = q.eq('category_id', filters.category)
    if (filters?.condition) q = q.eq('condition',   filters.condition)
    const from = (page - 1) * pageSize
    q = q.range(from, from + pageSize - 1)
    const { data, error, count } = await q
    if (error) throw error
    return { data: data as Asset[], count: count || 0 }
  },

  async getByDomain(domain: AssetDomain, filters?: Partial<FilterState>, page = 1, pageSize = 10) {
    let q = supabase
      .from('assets')
      .select('*, category:asset_categories(id,name,type,icon), building:buildings(id,name)', { count:'exact' })
      .eq('domain', domain)
      .order('created_at', { ascending: false })
    if (filters?.search)    q = q.or(`name.ilike.%${filters.search}%,asset_code.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`)
    if (filters?.status)    q = q.eq('status',      filters.status)
    if (filters?.building)  q = q.eq('building_id', filters.building)
    if (filters?.category)  q = q.eq('category_id', filters.category)
    if (filters?.condition) q = q.eq('condition',   filters.condition)
    const from = (page - 1) * pageSize
    q = q.range(from, from + pageSize - 1)
    const { data, error, count } = await q
    if (error) throw error
    return { data: data as Asset[], count: count || 0 }
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('assets')
      .select('*, category:asset_categories(id,name,type,icon), building:buildings(id,name), creator:profiles!created_by(full_name)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Asset
  },

  async getRecentByDomain(domain: AssetDomain, limit = 6) {
    const { data, error } = await supabase
      .from('assets')
      .select('*, category:asset_categories(name), building:buildings(name)')
      .eq('domain', domain)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as Asset[]
  },

  async create(formData: any, p0: any, imageFile: File | null) {
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    const { data, error } = await supabase
      .from('assets')
      .insert({ ...formData, created_by: userId || null, updated_at: new Date().toISOString() })
      .select().single()
    if (error) throw error
    return data as Asset
  },

  async update(id: string, formData: any, imageFile: File | null) {
    const { data, error } = await supabase
      .from('assets')
      .update({ ...formData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single()
    if (error) throw error
    return data as Asset
  },

  async delete(id: string) {
    const { error } = await supabase.from('assets').delete().eq('id', id)
    if (error) throw error
  },

  async getDashboardStats(domain?: AssetDomain) {
    let q = supabase.from('assets').select('status, domain')
    if (domain) q = q.eq('domain', domain)
    const [assetsRes, buildingsRes] = await Promise.all([
      q,
      supabase.from('buildings').select('id', { count: 'exact', head: true }),
    ])
    const assets = assetsRes.data || []
    return {
      totalAssets:       assets.length,
      activeAssets:      assets.filter(a => a.status === 'active').length,
      maintenanceAssets: assets.filter(a => a.status === 'maintenance').length,
      retiredAssets:     assets.filter(a => a.status === 'retired').length,
      buildingsCount:    buildingsRes.count || 0,
    }
  },

  async getMonthlyGrowth(domain?: AssetDomain) {
    const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    let q = supabase.from('assets').select('created_at').gte('created_at', since)
    if (domain) q = q.eq('domain', domain)
    const { data, error } = await q
    if (error) throw error
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const counts: Record<string, number> = Object.fromEntries(months.map(m => [m, 0]))
    data?.forEach(item => { const m = months[new Date(item.created_at).getMonth()]; counts[m]++ })
    return months.slice(0, new Date().getMonth() + 1).map(month => ({ month, count: counts[month] }))
  },

  async getAssetsByBuilding(domain?: AssetDomain) {
    let q = supabase.from('assets').select('building_id, domain')
    if (domain) q = q.eq('domain', domain)
    const [buildingsRes, assetsRes] = await Promise.all([
      supabase.from('buildings').select('id, name'),
      q,
    ])
    return (buildingsRes.data || []).map(b => ({
      name:  b.name,
      count: (assetsRes.data || []).filter(a => a.building_id === b.id).length,
    }))
  },

  async getRecentAssets(limit = 5) {
    const { data, error } = await supabase
      .from('assets')
      .select('*, category:asset_categories(name), building:buildings(name)')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as Asset[]
  },
}

export const categoryService = {
  async getAll() {
    const { data, error } = await supabase.from('asset_categories').select('*').order('name')
    if (error) throw error
    return data as AssetCategory[]
  },
  async getByType(type: 'it' | 'utility') {
    const { data, error } = await supabase.from('asset_categories').select('*').eq('type', type).order('name')
    if (error) throw error
    return data as AssetCategory[]
  },
  async create(d: { name: string; type: string; icon: string }) {
    const { data, error } = await supabase.from('asset_categories').insert(d).select().single()
    if (error) throw error
    return data as AssetCategory
  },
  async update(id: string, d: Partial<{ name: string; type: string; icon: string }>) {
    const { data, error } = await supabase.from('asset_categories').update(d).eq('id', id).select().single()
    if (error) throw error
    return data as AssetCategory
  },
  async delete(id: string) {
    const { error } = await supabase.from('asset_categories').delete().eq('id', id)
    if (error) throw error
  },
}

export const maintenanceService = {
  async getAll(assetId?: string) {
    let q = supabase
      .from('maintenance_logs')
      .select('*, asset:assets(name,asset_code), performer:profiles!performed_by(full_name)')
      .order('maintenance_date', { ascending: false })
    if (assetId) q = q.eq('asset_id', assetId)
    const { data, error } = await q
    if (error) throw error
    return data as MaintenanceLog[]
  },
  async create(d: { asset_id: string; notes: string; maintenance_date: string; performed_by: string; status: string; cost?: number }) {
    const { data, error } = await supabase.from('maintenance_logs').insert(d).select().single()
    if (error) throw error
    return data as MaintenanceLog
  },
}

export const userService = {
  async getAll() {
    const { data, error } = await supabase.from('profiles').select('*').order('full_name')
    if (error) throw error
    return data as Profile[]
  },
  async update(id: string, d: Partial<Profile>) {
    const { data, error } = await supabase.from('profiles').update(d).eq('id', id).select().single()
    if (error) throw error
    return data as Profile
  },
  async delete(id: string) {
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) throw error
  },
}

export const buildingService = {
  async getAll() {
    const { data, error } = await supabase.from('buildings').select('*').order('name')
    if (error) throw error
    return data
  },
  async create(d: { name: string; description?: string; floors?: number }) {
    const { data, error } = await supabase.from('buildings').insert(d).select().single()
    if (error) throw error
    return data
  },
  async update(id: string, d: Partial<{ name: string; description: string }>) {
    const { data, error } = await supabase.from('buildings').update(d).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async delete(id: string) {
    const { error } = await supabase.from('buildings').delete().eq('id', id)
    if (error) throw error
  },
}