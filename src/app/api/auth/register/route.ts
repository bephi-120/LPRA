import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email, password, inviteCode, username } = await req.json()

  // 1. Verificar código de invitación (variable de entorno server-side, nunca expuesta al browser)
  const validCode = process.env.INVITE_CODE
  if (!validCode || inviteCode !== validCode) {
    return NextResponse.json(
      { error: 'Código de invitación incorrecto.' },
      { status: 403 }
    )
  }

  // 2. Validaciones básicas
  if (!email || !password || !username) {
    return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 })
  }
  if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json(
      { error: 'El username debe tener al menos 3 caracteres y solo letras, números o _' },
      { status: 400 }
    )
  }

  // 3. Crear usuario con el service role key (tiene permisos de admin)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: newUser, error: signUpError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // No requiere confirmación por email
  })

  if (signUpError || !newUser.user) {
    const msg = signUpError?.message?.includes('already registered')
      ? 'Ese email ya está registrado.'
      : 'Error al crear la cuenta.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // 4. Crear el perfil en la tabla profiles
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id: newUser.user.id,
      username: username.toLowerCase(),
      display_name: username,
    })

  if (profileError) {
    // Si el username ya existe
    const msg = profileError.message?.includes('unique')
      ? 'Ese username ya está en uso.'
      : 'Error al crear el perfil.'
    // Rollback: borrar el usuario creado
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // 5. Iniciar sesión automáticamente después del registro
  const supabase = createRouteHandlerClient({ cookies })
  await supabase.auth.signInWithPassword({ email, password })

  return NextResponse.json({ success: true })
}
