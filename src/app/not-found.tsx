import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl mb-2">🎵</div>
      <h2 className="text-xl font-bold">Página no encontrada</h2>
      <p className="text-gray-500 text-sm">Esta página no existe o fue movida.</p>
      <Link href="/" className="btn-primary text-sm mt-2">
        Volver al inicio
      </Link>
    </div>
  )
}
