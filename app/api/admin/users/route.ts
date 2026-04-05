import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Verificar que quien crea es GOD
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

      const body = await request.json()
  const { email, password, full_name, role, company_name, phone } = body

if (profile?.role !== 'god' && profile?.role !== 'contratista') {
  return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
}

// Si es contratista, solo puede crear clientes y ayudantes
if (profile?.role === 'contratista' && role !== 'cliente' && role !== 'ayudante') {
  return NextResponse.json({ error: 'Solo puedes crear clientes y ayudantes' }, { status: 403 })
}



  console.log('Creando usuario:', { email, full_name, role })

  try {
    // Crear usuario en auth
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { full_name },
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
    // SIN emailConfirm aquí
  }
})

    console.log('Auth response:', { authData, authError })

    if (authError) throw authError
    if (!authData.user) throw new Error('No se pudo crear el usuario')

    // Crear perfil (sin tipos estrictos para evitar errores)
 const { error: profileError } = await (supabase as any)
  .from('profiles')
  .insert({
    id: authData.user.id,
    email: email,
    full_name: full_name,
    role: role,
    company_name: company_name || null,
    phone: phone || null,
    created_by: session.user.id, // AGREGAR ESTA LÍNEA
  })

    console.log('Profile error:', profileError)

    if (profileError) throw profileError

    return NextResponse.json({ 
      success: true, 
      user: { id: authData.user.id, email, role } 
    })

  } catch (error: any) {
    console.error('Error completo:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear usuario' },
      { status: 500 }
    )
  }
}