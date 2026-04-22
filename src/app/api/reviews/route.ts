import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const body = await req.json()
  const { album_youtube_id, review_text } = body

  if (!album_youtube_id) {
    return NextResponse.json({ error: 'Falta album_youtube_id.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('album_reviews')
    .upsert({
      user_id: session.user.id,
      album_youtube_id,
      review_text: review_text || null,
    }, {
      onConflict: 'user_id,album_youtube_id',
    })
    .select()
    .single()

  if (error) {
    console.error('[API /reviews] Error guardando review:', error)
    return NextResponse.json({ error: 'Error al guardar la reseña.' }, { status: 500 })
  }

  return NextResponse.json({ review: data })
}
