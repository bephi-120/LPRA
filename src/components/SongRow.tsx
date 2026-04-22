'use client'

import { useState } from 'react'
import { Play, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import RatingInput from './RatingInput'
import { formatDuration, formatRating, getRatingColor } from '@/lib/utils'
import type { Song, SongRating } from '@/types'

type SongRowProps = {
  song: Song
  existingRating: SongRating | null
  onPlay: (videoId: string, title: string) => void
  isPlaying: boolean
}

export default function SongRow({ song, existingRating, onPlay, isPlaying }: SongRowProps) {
  const [rating, setRating] = useState<number | null>(existingRating?.rating ?? null)
  const [review, setReview] = useState(existingRating?.review_text ?? '')
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleRatingChange(newRating: number) {
    // -1 significa "quitar rating"
    if (newRating === -1) {
      setSaving(true)
      await fetch(`/api/ratings?song_youtube_id=${song.youtube_id}`, { method: 'DELETE' })
      setRating(null)
      setReview('')
      setSaving(false)
      return
    }
    setRating(newRating)
    setSaved(false)
  }

  async function handleSave() {
    if (rating === null) return
    setSaving(true)
    setSaved(false)
    await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        song_youtube_id: song.youtube_id,
        album_youtube_id: song.album_youtube_id,
        rating,
        review_text: review || null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const hasChanges = rating !== (existingRating?.rating ?? null) ||
    review !== (existingRating?.review_text ?? '')

  return (
    <div className={`border-b border-gray-800/50 last:border-0 transition-colors ${isPlaying ? 'bg-sky-950/20' : ''}`}>
      {/* Fila principal */}
      <div className="flex items-center gap-3 px-4 py-3">

        {/* Número de track */}
        <span className="text-gray-600 text-xs w-5 text-right shrink-0">
          {song.track_number}
        </span>

        {/* Botón play */}
        <button
          onClick={() => onPlay(song.youtube_id, song.title)}
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors
            ${isPlaying ? 'bg-sky-600 text-white' : 'text-gray-500 hover:text-sky-400 hover:bg-gray-800'}`}
          title="Reproducir"
        >
          <Play className="w-3 h-3 fill-current" />
        </button>

        {/* Título */}
        <span className="flex-1 text-sm text-gray-200 truncate">
          {song.title}
        </span>

        {/* Duración */}
        <span className="text-xs text-gray-600 shrink-0 hidden sm:block">
          {formatDuration(song.duration_seconds)}
        </span>

        {/* Rating badge */}
        {rating !== null && (
          <span className={`text-sm font-bold w-8 text-right shrink-0 ${getRatingColor(rating)}`}>
            {formatRating(rating)}
          </span>
        )}

        {/* Expandir para rating/reseña */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 hover:text-gray-300 transition-colors shrink-0 ml-1"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Panel expandido: rating + reseña */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-800/30">
          <div className="pt-3">
            <p className="text-xs text-gray-500 mb-2">Calificación</p>
            <RatingInput value={rating} onChange={handleRatingChange} disabled={saving} />
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Reseña (opcional)</p>
            <textarea
              value={review}
              onChange={e => { setReview(e.target.value); setSaved(false) }}
              placeholder="Qué te pareció esta canción..."
              rows={2}
              className="textarea text-sm"
              disabled={saving}
            />
          </div>

          {rating !== null && (hasChanges || !existingRating) && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm py-1.5 px-4 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar'}
            </button>
          )}

          {saved && (
            <p className="text-green-400 text-xs">✓ Rating guardado</p>
          )}
        </div>
      )}
    </div>
  )
}
