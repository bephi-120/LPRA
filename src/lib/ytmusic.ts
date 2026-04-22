// ============================================
// LPRA - YouTube Music API wrapper
// Centraliza toda la interacción con ytmusic-api
// ============================================
import YTMusic from 'ytmusic-api'
import type { YTMusicSearchResult, YTMusicAlbum, YTMusicTrack, YTMusicThumbnail } from '@/types'

let ytmusicInstance: YTMusic | null = null

async function getYTMusic(): Promise<YTMusic> {
  if (!ytmusicInstance) {
    ytmusicInstance = new YTMusic()
    await ytmusicInstance.initialize()
  }
  return ytmusicInstance
}

function getBestThumbnail(thumbnails: any[]): string | null {
  if (!thumbnails || thumbnails.length === 0) return null
  // Preferir la más grande disponible
  const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0))
  return sorted[0]?.url || null
}

// Buscar álbumes por query
export async function searchAlbums(query: string): Promise<YTMusicSearchResult[]> {
  const ytmusic = await getYTMusic()

  try {
    const results = await ytmusic.searchAlbums(query)

    return results.map((result: any) => ({
      type: result.albumType || 'ALBUM',
      browseId: result.albumId || result.browseId || '',
      title: result.name || result.title || '',
      artist: result.artist?.name || result.artists?.[0]?.name || 'Artista desconocido',
      year: result.year ? String(result.year) : null,
      thumbnails: result.thumbnails || [],
    })).filter((r: YTMusicSearchResult) => r.browseId)
  } catch (error) {
    console.error('Error buscando álbumes en YTMusic:', error)
    return []
  }
}

// Obtener detalle completo de un álbum (con tracklist)
export async function getAlbumDetails(browseId: string): Promise<YTMusicAlbum | null> {
  const ytmusic = await getYTMusic()

  try {
    const album = await ytmusic.getAlbum(browseId)

    if (!album) return null

    const tracks: YTMusicTrack[] = (album.songs || album.tracks || []).map((track: any, index: number) => ({
      videoId: track.videoId || track.id || '',
      title: track.name || track.title || `Track ${index + 1}`,
      duration: track.duration || track.duration_seconds || null,
      trackNumber: track.trackNumber || track.track_number || index + 1,
    })).filter((t: YTMusicTrack) => t.videoId)

    return {
      browseId,
      title: album.name || album.title || '',
      artist: album.artist?.name || album.artists?.[0]?.name || 'Artista desconocido',
      year: album.year ? String(album.year) : null,
      thumbnails: album.thumbnails || [],
      tracks,
    }
  } catch (error) {
    console.error(`Error obteniendo álbum ${browseId}:`, error)
    return null
  }
}

export { getBestThumbnail }
