'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Disc3, Loader2, Star, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import YouTubePlayer from '@/components/YouTubePlayer'
import SongRow from '@/components/SongRow'
import { formatRating, getRatingColor, calcularPromedioAlbum } from '@/lib/utils'
import type { Album, Song, SongRating, AlbumReview } from '@/types'

export default function AlbumPage() {
  const params = useParams()
  const browseId = params?.browseId as string

  const [album, setAlbum] = useState<Album | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [myRatings, setMyRatings] = useState<SongRating[]>([])
  const [myReview, setMyReview] = useState<AlbumReview | null>(null)
  const [reviewText, setReviewText] = useState('')
  const [savingReview, setSavingReview] = useState(false)
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)
  const [currentTitle, setCurrentTitle] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAlbum = useCallback(async () => {
    if (!browseId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/album/${browseId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error cargando álbum')
      
      const albumData: Album = data.album
      const songsData: Song[] = (data.album.songs || [])
        .sort((a: Song, b: Song) => a.track_number - b.track_number)

      setAlbum(albumData)
      setSongs(songsData)
      if (songsData.length > 0) {
        setCurrentVideoId(songsData[0].youtube_id)
        setCurrentTitle(songsData[0].title)
      }
    } catch (e: any) {
      console.error('Error cargando álbum:', e)
      setError(e.message || 'No se pudo cargar el álbum.')
    } finally {
      setLoading(false)
    }
  }, [browseId])

  const loadRatings = useCallback(async () => {
    if (!browseId) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: ratings } = await supabase
      .from('song_ratings')
      .select('*')
      .eq('album_youtube_id', browseId)
      .eq('user_id', session.user.id)

    const { data: review } = await supabase
      .from('album_reviews')
      .select('*')
      .eq('album_youtube_id', browseId)
      .eq('user_id', session.user.id)
      .maybeSingle()

    setMyRatings((ratings as SongRating[]) || [])
    if (review) {
      setMyReview(review as AlbumReview)
      setReviewText(review.review_text || '')
    }
  }, [browseId])

  useEffect(() => { loadAlbum() }, [loadAlbum])
  useEffect(() => { if (!loading) loadRatings() }, [loading, loadRatings])

  async function handleSaveReview() {
    setSavingReview(true)
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ album_youtube_id: browseId, review_text: reviewText }),
    })
    setSavingReview(false)
  }

  const getRatingForSong = (songId: string): SongRating | null =>
    myRatings.find(r => r.song_youtube_id === songId) ?? null

  const promedio = calcularPromedioAlbum(myRatings)

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-gray-500 text-sm">Cargando álbum...</p>
      </div>
    )
  }

  if (error || !album) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-400">{error || 'Álbum no encontrado'}</p>
        <p className="text-gray-600 text-sm">El álbum puede no estar disponible en YouTube Music.</p>
        <Link href="/" className="btn-ghost text-sm">← Volver al inicio</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="btn-ghost py-1.5 px-2 text-sm flex items-center gap-1.5 text-gray-400">
            <ArrowLeft className="w-4 h-4" />
            Inicio
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">

          {/* Columna izquierda */}
          <div className="space-y-5">
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                {album.cover_url ? (
                  <Image src={album.cover_url} alt={album.title} width={96} height={96}
                    className="w-full h-full object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Disc3 className="w-10 h-10 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-xl leading-tight">{album.title}</h1>
                <p className="text-gray-400 mt-0.5">{album.artist}</p>
                {album.release_year && <p className="text-gray-600 text-sm mt-0.5">{album.release_year}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className={`text-lg font-bold ${getRatingColor(promedio)}`}>
                    {formatRating(promedio)}
                  </span>
                  <span className="text-gray-600 text-xs">
                    ({myRatings.length}/{songs.length} canciones)
                  </span>
                </div>
              </div>
            </div>

            {currentVideoId && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5 truncate">▶ {currentTitle}</p>
                <YouTubePlayer videoId={currentVideoId} title={currentTitle} />
              </div>
            )}

            <div className="card p-4 space-y-3">
              <p className="text-sm font-medium text-gray-300">Reseña del álbum</p>
              <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
                placeholder="Escribí tu opinión general del álbum..." rows={4} className="textarea text-sm" />
              <button onClick={handleSaveReview}
                disabled={savingReview || reviewText === (myReview?.review_text ?? '')}
                className="btn-primary text-sm py-1.5 px-4">
                {savingReview ? 'Guardando...' : 'Guardar reseña'}
              </button>
            </div>
          </div>

          {/* Columna derecha: tracklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Canciones</h2>
              <span className="text-xs text-gray-600">{songs.length} tracks</span>
            </div>
            <div className="card overflow-hidden">
              {songs.map(song => (
                <SongRow key={song.youtube_id} song={song}
                  existingRating={getRatingForSong(song.youtube_id)}
                  onPlay={(videoId, title) => { setCurrentVideoId(videoId); setCurrentTitle(title) }}
                  isPlaying={currentVideoId === song.youtube_id} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
