import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import SearchBar from '@/components/SearchBar'
import AlbumCard from '@/components/AlbumCard'
import type { Album, UserAlbumRating } from '@/types'

export default async function HomePage() {
  // Sin genérico — evita el error "never" de TypeScript
  const supabase = createServerComponentClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', session.user.id)
    .single()

  const { data: userRatingsRaw } = await supabase
    .from('user_album_ratings')
    .select('*')
    .eq('user_id', session.user.id)

  const userRatings = (userRatingsRaw ?? []) as UserAlbumRating[]

  let ratedAlbums: (Album & { calculated_rating: number | null; songs_rated: number })[] = []

  if (userRatings.length > 0) {
    const albumIds = userRatings.map(r => r.album_youtube_id)
    const { data: albumsRaw } = await supabase
      .from('albums')
      .select('*')
      .in('youtube_id', albumIds)

    const albums = (albumsRaw ?? []) as Album[]

    ratedAlbums = albums.map(album => {
      const rating = userRatings.find(r => r.album_youtube_id === album.youtube_id)
      return {
        ...album,
        calculated_rating: rating?.calculated_rating ?? null,
        songs_rated: rating?.songs_rated ?? 0,
      }
    }).sort((a, b) => (b.calculated_rating ?? 0) - (a.calculated_rating ?? 0))
  }

  const displayName = profile?.display_name || profile?.username || session.user.email

  return (
    <div className="min-h-screen">
      <Navbar username={profile?.username} />

      <main className="max-w-5xl mx-auto px-4 py-10">

        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Hola, {displayName?.split('@')[0]} 👋
          </h1>
          <p className="text-gray-500 mb-8">
            Buscá un álbum para calificarlo o revisá tus reseñas.
          </p>
          <div className="flex justify-center">
            <SearchBar />
          </div>
        </section>

        {ratedAlbums.length > 0 ? (
          <section>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">
              Tus álbumes calificados
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {ratedAlbums.map(album => (
                <AlbumCard
                  key={album.youtube_id}
                  album={album}
                  rating={album.calculated_rating}
                  songsRated={album.songs_rated}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="text-center py-16">
            <div className="text-5xl mb-4">🎵</div>
            <p className="text-gray-500 text-sm">
              Todavía no calificaste ningún álbum.
              <br />
              Buscá uno arriba para empezar.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}
