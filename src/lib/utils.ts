import type { SongRating } from '@/types'

// Calcula el promedio del álbum a partir de los ratings de canciones
export function calcularPromedioAlbum(ratings: SongRating[]): number | null {
  if (ratings.length === 0) return null
  const suma = ratings.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((suma / ratings.length) * 100) / 100
}

// Devuelve el color del rating (rojo → amarillo → verde)
export function getRatingColor(rating: number | null): string {
  if (rating === null) return 'text-gray-400'
  if (rating >= 8) return 'text-green-400'
  if (rating >= 6) return 'text-yellow-400'
  if (rating >= 4) return 'text-orange-400'
  return 'text-red-400'
}

// Formatea segundos como "3:45"
export function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Formatea un número de rating para mostrar (ej: 8.5 → "8.5", 8.0 → "8.0")
export function formatRating(rating: number | null): string {
  if (rating === null) return '—'
  return rating.toFixed(1)
}
