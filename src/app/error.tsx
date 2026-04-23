'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl mb-2">⚠️</div>
      <h2 className="text-xl font-bold">Algo salió mal</h2>
      <p className="text-gray-500 text-sm max-w-sm">
        Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
      </p>
      <div className="flex gap-3 mt-2">
        <button onClick={reset} className="btn-primary text-sm">
          Intentar de nuevo
        </button>
        <Link href="/" className="btn-ghost text-sm">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
