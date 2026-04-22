import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que NO requieren autenticación
const PUBLIC_ROUTES = ['/login', '/auth/callback']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresca la sesión si existe (mantiene el token activo)
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Si la ruta es pública, dejá pasar siempre
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    // Si ya está logueado y quiere ir al login, redirigí al home
    if (session && pathname === '/login') {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return res
  }

  // Si no hay sesión, redirigí al login
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return res
}

export const config = {
  matcher: [
    // Aplica a todas las rutas excepto archivos estáticos y API interna de Next
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
}
