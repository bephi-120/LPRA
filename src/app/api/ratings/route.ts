import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Supabase_Database, RatingInput } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  // Verificar que el usuario está autenticado
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const body: RatingInput = await req.json()
  const { song_youtube_id, album_youtube_id, rating, review_text } = body

  // Validaciones
  if (!song_youtube_id || !album_youtube_id) {
    return NextResponse.json({ error: 'Faltan IDs de canción o álbum.' }, { status: 400 })
  }
  if (typeof rating !== 'number' || rating < 0 || rating > 10) {
    return NextResponse.json({ error: 'El rating debe ser un número entre 0 y 10.' }, { status: 400 })
  }

  // Upsert del rating (crea o actualiza)
  const { data, error } = await supabase
    .from('song_ratings')
    .upsert({
      user_id: session.user.id,
      song_youtube_id,
      album_youtube_id,
      rating,
      review_text: review_text || null,
    }, {
      onConflict: 'user_id,song_youtube_id',
    })
    .select()
    .single()

  if (error) {
    console.error('[API /ratings] Error guardando rating:', error)
    return NextResponse.json({ error: 'Error al guardar el rating.' }, { status: 500 })
  }

  return NextResponse.json({ rating: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const song_youtube_id = searchParams.get('song_youtube_id')

  if (!song_youtube_id) {
    return NextResponse.json({ error: 'Falta song_youtube_id.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('song_ratings')
    .delete()
    .eq('user_id', session.user.id)
    .eq('song_youtube_id', song_youtube_id)

  if (error) {
    return NextResponse.json({ error: 'Error al eliminar el rating.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
