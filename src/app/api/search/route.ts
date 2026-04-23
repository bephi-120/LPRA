import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { searchAlbums, searchSongs } from '@/lib/ytmusic'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query muy corta.' }, { status: 400 })
  }

  try {
    // Buscar álbumes y canciones en paralelo
    const [albums, songs] = await Promise.all([
      searchAlbums(query),
      searchSongs(query),
    ])

    // Mezclar: primero álbumes, luego singles únicos (que no dupliquen)
    const albumIds = new Set(albums.map(a => a.browseId))
    const uniqueSongs = songs.filter(s => !albumIds.has(s.browseId)).slice(0, 3)

    const results = [...albums.slice(0, 6), ...uniqueSongs]

    return NextResponse.json({ results })
  } catch (error) {
    console.error('[API /search] Error:', error)
    return NextResponse.json({ error: 'Error al buscar.' }, { status: 500 })
  }
}
