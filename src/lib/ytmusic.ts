import YTMusic from 'ytmusic-api'
import type { YTMusicSearchResult, YTMusicAlbum, YTMusicTrack } from '@/types'

// En serverless cada invocación es nueva, no usar singleton global
async function getYTMusic(): Promise<YTMusic> {
  const ytmusic = new YTMusic()
  await ytmusic.initialize()
  return ytmusic
}

export function getBestThumbnail(thumbnails: any[]): string | null {
  if (!thumbnails || thumbnails.length === 0) return null
  const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0))
  return sorted[0]?.url || null
}

export async function searchAlbums(query: string): Promise<YTMusicSearchResult[]> {
  const ytmusic = await getYTMusic()
  try {
    const results = await ytmusic.searchAlbums(query)
    return results.map((r: any) => ({
      type: r.albumType || 'ALBUM',
      browseId: r.albumId || r.browseId || '',
      title: r.name || r.title || '',
      artist: r.artist?.name || r.artists?.[0]?.name || 'Artista desconocido',
      year: r.year ? String(r.year) : null,
      thumbnails: r.thumbnails || [],
    })).filter((r: YTMusicSearchResult) => r.browseId)
  } catch (error) {
    console.error('Error buscando álbumes:', error)
    return []
  }
}

// Busca canciones sueltas (para artistas que no tienen álbumes en YT Music)
export async function searchSongs(query: string): Promise<YTMusicSearchResult[]> {
  const ytmusic = await getYTMusic()
  try {
    const results = await ytmusic.searchSongs(query)
    return results.map((r: any) => ({
      type: 'SINGLE' as const,
      browseId: r.videoId || '',
      title: r.name || r.title || '',
      artist: r.artist?.name || r.artists?.[0]?.name || 'Artista desconocido',
      year: null,
      thumbnails: r.thumbnails || [],
    })).filter((r: YTMusicSearchResult) => r.browseId)
  } catch (error) {
    console.error('Error buscando canciones:', error)
    return []
  }
}

export async function getAlbumDetails(browseId: string): Promise<YTMusicAlbum | null> {
  const ytmusic = await getYTMusic()
  try {
    const album = await ytmusic.getAlbum(browseId) as any
    if (!album) return null

    const rawTracks = album.songs || []
    const tracks: YTMusicTrack[] = rawTracks
      .map((track: any, index: number) => ({
        videoId: track.videoId || track.id || '',
        title: track.name || track.title || `Track ${index + 1}`,
        duration: track.duration ?? null,
        trackNumber: track.trackNumber ?? track.track_number ?? index + 1,
      }))
      .filter((t: YTMusicTrack) => t.videoId)

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
