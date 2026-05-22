import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'tech-admin' | 'utility-admin'
          avatar_url: string | null
          department: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      buildings: {
        Row: {
          id: string
          name: string
          description: string | null
          floors: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['buildings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['buildings']['Insert']>
      }
      asset_categories: {
        Row: {
          id: string
          name: string
          type: string | null
          icon: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['asset_categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['asset_categories']['Insert']>
      }
      assets: {
        Row: {
          id: string
          asset_code: string | null
          name: string
          description: string | null
          category_id: string | null
          building_id: string | null
          floor_room: string | null
          serial_number: string | null
          status: 'active' | 'inactive' | 'maintenance' | 'retired'
          condition: 'excellent' | 'good' | 'fair' | 'poor'
          image_url: string | null
          assigned_to: string | null
          purchase_date: string | null
          maintenance_date: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['assets']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['assets']['Insert']>
      }
      maintenance_logs: {
        Row: {
          id: string
          asset_id: string
          notes: string | null
          maintenance_date: string
          performed_by: string | null
          status: string | null
          cost: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['maintenance_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['maintenance_logs']['Insert']>
      }
    }
  }
}
