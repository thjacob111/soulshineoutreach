import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)

export type ClientRecord = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  status: 'new' | 'contacted' | 'assessed' | 'enrolled' | 'closed'
  notes: string
  created_at: string
}

export type Assessment = {
  id: string
  client_id: string
  energy_provider: string
  energy_bill: number
  gas_provider: string
  gas_bill: number
  water_bill: number
  internet_provider: string
  internet_bill: number
  security_provider: string
  security_bill: number
  wellness_goals: string
  notes: string
  created_at: string
}
