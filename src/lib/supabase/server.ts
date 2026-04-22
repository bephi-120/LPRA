import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Supabase_Database } from '@/types'

// Cliente para usar en Server Components y Route Handlers
// Lee la sesión del usuario desde las cookies del servidor
export function createServerClient() {
  return createServerComponentClient<Supabase_Database>({ cookies })
}
