import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { searchAlbums } from '@/lib/ytmusic'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'El parámetro "q" es requerido y debe tener al menos 2 caracteres.' },
      { status: 400 }
    )
  }

  try {
    const results = await searchAlbums(query)
    return NextResponse.json({ results })
  } catch (error) {
    console.error('[API /search] Error:', error)
    return NextResponse.json(
      { error: 'Error al buscar en YouTube Music.' },
      { status: 500 }
    )
  }
}
