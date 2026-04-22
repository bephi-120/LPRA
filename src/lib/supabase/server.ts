import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Sin genérico — evita errores de TypeScript con las queries
export function createServerClient() {
  return createServerComponentClient({ cookies })
}
