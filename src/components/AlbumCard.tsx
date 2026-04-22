import Link from 'next/link'
import Image from 'next/image'
import { Disc3, Star } from 'lucide-react'
import { formatRating, getRatingColor } from '@/lib/utils'
import type { Album } from '@/types'

type AlbumCardProps = {
  album: Album
  rating?: number | null      // promedio calculado del usuario
  songsRated?: number
}

export default function AlbumCard({ album, rating, songsRated }: AlbumCardProps) {
  return (
    <Link
      href={`/album/${album.youtube_id}`}
      className="card group flex flex-col overflow-hidden hover:border-gray-700 hover:bg-gray-900/80 transition-all duration-200"
    >
      {/* Cover */}
      <div className="relative aspect-square bg-gray-800 overflow-hidden">
        {album.cover_url ? (
          <Image
            src={album.cover_url}
            alt={`${album.title} — ${album.artist}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 className="w-12 h-12 text-gray-700" />
          </div>
        )}

        {/* Rating badge encima de la imagen */}
        {rating !== null && rating !== undefined && (
          <div className="absolute top-2 right-2 bg-gray-950/90 rounded-md px-2 py-0.5 flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className={`text-sm font-bold ${getRatingColor(rating)}`}>
              {formatRating(rating)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-medium text-sm text-gray-100 truncate leading-snug">
          {album.title}
        </p>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {album.artist}
          {album.release_year && (
            <span className="text-gray-600"> · {album.release_year}</span>
          )}
        </p>
        {songsRated !== undefined && album.total_tracks && (
          <p className="text-xs text-gray-600 mt-1">
            {songsRated}/{album.total_tracks} canciones calificadas
          </p>
        )}
      </div>
    </Link>
  )
}
