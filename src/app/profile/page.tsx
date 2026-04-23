export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import { formatRating, getRatingColor } from '@/lib/utils'
import { Disc3, Star } from 'lucide-react'
import type { Album, UserAlbumRating } from '@/types'

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { data: ratingsRaw } = await supabase
    .from('user_album_ratings')
    .select('*')
    .eq('user_id', session.user.id)
    .order('calculated_rating', { ascending: false })

  const ratings = (ratingsRaw ?? []) as UserAlbumRating[]

  let albums: Album[] = []
  if (ratings.length > 0) {
    const { data: albumsRaw } = await supabase
      .from('albums')
      .select('*')
      .in('youtube_id', ratings.map(r => r.album_youtube_id))
    albums = (albumsRaw ?? []) as Album[]
  }

  const albumMap = Object.fromEntries(albums.map(a => [a.youtube_id, a]))
  const totalRated = ratings.length
  const avgGlobal = totalRated > 0
    ? ratings.reduce((acc, r) => acc + (r.calculated_rating ?? 0), 0) / totalRated
    : null

  return (
    <div className="min-h-screen">
      <Navbar username={profile?.username} />

      <main className="max-w-3xl mx-auto px-4 py-10">

        {/* Header perfil */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-full bg-sky-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {(profile?.display_name || profile?.username || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile?.display_name || profile?.username}</h1>
            <p className="text-gray-500 text-sm">@{profile?.username}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>{totalRated} álbumes calificados</span>
              {avgGlobal !== null && (
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className={getRatingColor(avgGlobal)}>{formatRating(avgGlobal)}</span>
                  <span className="text-gray-600">promedio</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lista de álbumes calificados */}
        {ratings.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>Todavía no calificaste ningún álbum.</p>
            <Link href="/" className="btn-primary inline-block mt-4 text-sm">Buscar música</Link>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Historial de ratings
            </h2>
            {ratings.map(r => {
              const album = albumMap[r.album_youtube_id]
              if (!album) return null
              return (
                <Link
                  key={r.album_youtube_id}
                  href={`/album/${r.album_youtube_id}`}
                  className="card flex items-center gap-4 p-3 hover:border-gray-700 transition-colors"
                >
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-800 shrink-0">
                    {album.cover_url ? (
                      <Image src={album.cover_url} alt={album.title} width={48} height={48}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc3 className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{album.title}</p>
                    <p className="text-gray-500 text-xs truncate">{album.artist}</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {r.songs_rated}/{album.total_tracks ?? '?'} canciones
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-bold ${getRatingColor(r.calculated_rating)}`}>
                      {formatRating(r.calculated_rating)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
