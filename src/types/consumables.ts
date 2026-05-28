// src/types/consumables.ts
// Add this file to your project at src/types/consumables.ts

export type ConsumableType = 'office' | 'maintenance'

export interface Consumable {
  id: string
  type: ConsumableType
  item_type: string
  description: string | null
  volume: string | null
  unit: string
  current_stock: number
  low_stock_threshold: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ConsumableRestock {
  id: string
  consumable_id: string
  date_restock: string
  stock_quantity: number
  remarks: string | null
  restocked_by: string | null
  created_at: string
}

export interface ConsumableWithdrawal {
  id: string
  consumable_id: string
  date_withdrawn: string
  quantity_withdrawn: number
  withdrawn_by: string | null
  purpose: string | null
  department: string | null
  remarks: string | null
  created_by: string | null
  created_at: string
}
