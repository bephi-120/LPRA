import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getAlbumDetails, getBestThumbnail } from '@/lib/ytmusic'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { browseId: string } }
) {
  const { browseId } = params
  // Sin genérico <Supabase_Database> — evita el error de TypeScript con upsert
  const supabase = createRouteHandlerClient({ cookies })

  // 1. Intentar traer el álbum desde Supabase (ya cacheado)
  const { data: existingAlbum } = await supabase
    .from('albums')
    .select('*, songs(*)')
    .eq('youtube_id', browseId)
    .single()

  if (existingAlbum) {
    return NextResponse.json({ album: existingAlbum, source: 'cache' })
  }

  // 2. Si no está en DB, buscarlo en YouTube Music
  const ytAlbum = await getAlbumDetails(browseId)
  if (!ytAlbum) {
    return NextResponse.json(
      { error: 'Álbum no encontrado.' },
      { status: 404 }
    )
  }

  // 3. Persistir el álbum en Supabase
  const { error: albumError } = await supabase
    .from('albums')
    .upsert({
      youtube_id: ytAlbum.browseId,
      title: ytAlbum.title,
      artist: ytAlbum.artist,
      cover_url: getBestThumbnail(ytAlbum.thumbnails),
      release_year: ytAlbum.year ? parseInt(ytAlbum.year) : null,
      total_tracks: ytAlbum.tracks.length,
    })

  if (albumError) {
    console.error('[API /album] Error guardando álbum:', albumError)
    return NextResponse.json({ error: 'Error al guardar el álbum.' }, { status: 500 })
  }

  // 4. Persistir las canciones
  if (ytAlbum.tracks.length > 0) {
    const songsToInsert = ytAlbum.tracks.map(track => ({
      youtube_id: track.videoId,
      album_youtube_id: ytAlbum.browseId,
      track_number: track.trackNumber,
      title: track.title,
      duration_seconds: track.duration,
    }))

    const { error: songsError } = await supabase
      .from('songs')
      .upsert(songsToInsert)

    if (songsError) {
      console.error('[API /album] Error guardando canciones:', songsError)
    }
  }

  // 5. Devolver el álbum formateado
  return NextResponse.json({
    album: {
      youtube_id: ytAlbum.browseId,
      title: ytAlbum.title,
      artist: ytAlbum.artist,
      cover_url: getBestThumbnail(ytAlbum.thumbnails),
      release_year: ytAlbum.year ? parseInt(ytAlbum.year) : null,
      total_tracks: ytAlbum.tracks.length,
      songs: ytAlbum.tracks.map(t => ({
        youtube_id: t.videoId,
        album_youtube_id: ytAlbum.browseId,
        track_number: t.trackNumber,
        title: t.title,
        duration_seconds: t.duration,
      })),
    },
    source: 'ytmusic',
  })
}
