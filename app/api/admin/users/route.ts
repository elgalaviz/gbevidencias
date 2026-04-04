import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database'

// Admin client con service role para crear usuarios
const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // service_role key en este proyecto
)

export async function POST(request: Request) {
  try {
    // Verificar que quien llama es GOD
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single() as { data: { role: string } | null }

    if (callerProfile?.role !== 'god') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, full_name, role, company_name, phone } = body

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Crear usuario en auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // confirmar email automáticamente
      user_metadata: { full_name, role },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Actualizar perfil con datos extra (el trigger ya creó el perfil básico)
    if (authData.user) {
      await (adminClient.from('profiles') as any)
        .update({
          full_name,
          role,
          company_name: company_name || null,
          phone: phone || null,
          created_by: session.user.id,
        })
        .eq('id', authData.user.id)
    }

    return NextResponse.json({ success: true, userId: authData.user?.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
