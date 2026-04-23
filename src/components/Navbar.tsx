'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Music2, LogOut, Search, User } from 'lucide-react'

type NavbarProps = {
  username?: string | null
}

export default function Navbar({ username }: NavbarProps) {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center group-hover:bg-sky-500 transition-colors">
            <Music2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">LPRA</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <Link href="/" className="btn-ghost text-sm py-1.5 px-3 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            Buscar
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="btn-ghost text-sm py-1.5 px-3 flex items-center gap-1.5 text-gray-400"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{username || 'Perfil'}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="btn-ghost text-sm py-1.5 px-3 flex items-center gap-1.5 text-gray-400"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  )
}
