'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Music2, Loader2 } from 'lucide-react'

type Tab = 'login' | 'register'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  const [tab, setTab] = useState<Tab>('login')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regCode, setRegCode] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })
    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: regEmail,
        password: regPassword,
        username: regUsername,
        inviteCode: regCode,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Error al registrarse.')
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  function switchTab(t: Tab) {
    setTab(t)
    setError(null)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-sky-600 rounded-2xl mb-4">
            <Music2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">LPRA</h1>
          <p className="text-gray-500 text-sm mt-1">Reseñas de música para amigos</p>
        </div>

        <div className="flex mb-4 bg-gray-900 rounded-xl p-1 border border-gray-800">
          <button onClick={() => switchTab('login')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors
              ${tab === 'login' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            Entrar
          </button>
          <button onClick={() => switchTab('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors
              ${tab === 'register' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            Registrarse
          </button>
        </div>

        <div className="card p-6">
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  placeholder="vos@ejemplo.com" required className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Contraseña</label>
                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••" required className="input" />
              </div>
              {error && <p className="text-red-400 text-sm bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Username</label>
                <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)}
                  placeholder="tucuenta" required className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  placeholder="vos@ejemplo.com" required className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Contraseña</label>
                <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres" required className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Código de invitación</label>
                <input type="text" value={regCode} onChange={e => setRegCode(e.target.value)}
                  placeholder="••••••••" required className="input" />
                <p className="text-xs text-gray-600 mt-1">Necesitás un código para crear una cuenta.</p>
              </div>
              {error && <p className="text-red-400 text-sm bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">Acceso solo por invitación.</p>
      </div>
    </main>
  )
}
