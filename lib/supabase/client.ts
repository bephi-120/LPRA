import { createClient } from '@supabase/supabase-js'
import type { Supabase_Database } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase. Revisá .env.local')
}

// Cliente para usar en componentes de cliente (browser)
export const supabase = createClient<Supabase_Database>(supabaseUrl, supabaseAnonKey)
