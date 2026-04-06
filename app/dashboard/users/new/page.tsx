import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
import UserForm from '@/components/users/UserForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewUserPage() {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single() as { data: ProfileRow | null }

  if (!profile) {
    redirect('/login')
  }

  // Solo GOD y Contratistas pueden crear usuarios
  if (profile.role !== 'god' && profile.role !== 'contratista') {
    redirect('/dashboard')
  }

  // Determinar qué roles puede crear
  let allowedRoles: string[] = []
  if (profile.role === 'god') {
    allowedRoles = ['god', 'contratista', 'cliente', 'ayudante']
  } else if (profile.role === 'contratista') {
    allowedRoles = ['cliente', 'ayudante']
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/users"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Usuarios
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Crear Nuevo Usuario
          </h1>
          <p className="text-gray-600 mt-2">
            El usuario recibirá acceso inmediato (sin necesidad de confirmar email)
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <UserForm 
            allowedRoles={allowedRoles} 
            currentUserId={profile.id}
          />
        </div>
      </div>
    </div>
  )
}