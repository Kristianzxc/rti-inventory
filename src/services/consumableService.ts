// src/services/consumableService.ts
// Add this file to your project at src/services/consumableService.ts

import { supabase } from '@/lib/supabase'
import type { Consumable, ConsumableRestock, ConsumableWithdrawal } from '@/types/consumables'

export const consumableService = {
  // ── Consumables master ─────────────────────────────────────────────
  async getAll() {
    const { data, error } = await supabase
      .from('consumables')
      .select('*')
      .order('item_type')
    if (error) throw error
    return data as Consumable[]
  },

  async getByType(type: 'office' | 'maintenance') {
    const { data, error } = await supabase
      .from('consumables')
      .select('*')
      .eq('type', type)
      .order('item_type')
    if (error) throw error
    return data as Consumable[]
  },

  async create(payload: {
    type: string
    item_type: string
    description?: string
    unit: string
    low_stock_threshold: number
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('consumables')
      .insert({ ...payload, created_by: user?.id || null })
      .select()
      .single()
    if (error) throw error
    return data as Consumable
  },

  async update(id: string, payload: Partial<{
    item_type: string
    description: string
    unit: string
    low_stock_threshold: number
  }>) {
    const { data, error } = await supabase
      .from('consumables')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Consumable
  },

  async delete(id: string) {
    // Cascade delete is handled by the DB (ON DELETE CASCADE on restock + withdrawal tables)
    const { error } = await supabase.from('consumables').delete().eq('id', id)
    if (error) throw error
  },

  // ── Restocks ────────────────────────────────────────────────────────
  async getRestocks(consumableId: string) {
    const { data, error } = await supabase
      .from('consumable_restocks')
      .select('*')
      .eq('consumable_id', consumableId)
      .order('date_restock', { ascending: false })
    if (error) throw error
    return data as ConsumableRestock[]
  },

  async addRestock(payload: {
    consumable_id: string
    date_restock: string
    stock_quantity: number
    remarks?: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('consumable_restocks')
      .insert({ ...payload, restocked_by: user?.id || null })
      .select()
      .single()
    if (error) throw error
    // Note: current_stock on the parent row is auto-updated by DB trigger
    return data as ConsumableRestock
  },

  async deleteRestock(id: string) {
    const { error } = await supabase.from('consumable_restocks').delete().eq('id', id)
    if (error) throw error
  },

  // ── Withdrawals ─────────────────────────────────────────────────────
  async getWithdrawals(consumableId: string) {
    const { data, error } = await supabase
      .from('consumable_withdrawals')
      .select('*')
      .eq('consumable_id', consumableId)
      .order('date_withdrawn', { ascending: false })
    if (error) throw error
    return data as ConsumableWithdrawal[]
  },

  async addWithdrawal(payload: {
    consumable_id: string
    date_withdrawn: string
    quantity_withdrawn: number
    withdrawn_by?: string
    purpose?: string
    department?: string
    remarks?: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('consumable_withdrawals')
      .insert({ ...payload, created_by: user?.id || null })
      .select()
      .single()
    if (error) throw error
    // Note: current_stock is auto-updated by DB trigger
    return data as ConsumableWithdrawal
  },

  async deleteWithdrawal(id: string) {
    const { error } = await supabase.from('consumable_withdrawals').delete().eq('id', id)
    if (error) throw error
  },

  // ── Dashboard summary (for future use or utility dashboard widget) ──
  async getLowStockItems(threshold?: number) {
    let q = supabase
      .from('consumables')
      .select('*')
    if (threshold !== undefined) {
      q = q.lte('current_stock', threshold)
    } else {
      // Items where current_stock ≤ their own threshold
      // Supabase doesn't support column-to-column comparisons in JS SDK filters,
      // so we filter in JS after fetching
    }
    const { data, error } = await q
    if (error) throw error
    const items = data as Consumable[]
    return threshold !== undefined
      ? items
      : items.filter(c => c.current_stock <= c.low_stock_threshold)
  },
}