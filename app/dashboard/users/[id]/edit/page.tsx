import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
import UserEditForm from '@/components/users/UserEditForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient<Database>({ cookies })

  // Verificar autenticación
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Obtener perfil del usuario actual
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single() as { data: ProfileRow | null }

  if (!currentProfile) {
    redirect('/login')
  }

  // Obtener el usuario a editar
  const { data: userToEdit, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single() as { data: ProfileRow | null; error: unknown }

  if (error || !userToEdit) {
    notFound()
  }

  // Verificar permisos
  const canEdit = 
    currentProfile.role === 'god' || // GOD puede editar a todos
    (currentProfile.role === 'contratista' && userToEdit.created_by === currentProfile.id) || // Contratista solo a sus creados
    currentProfile.id === userToEdit.id // Usuario puede editarse a sí mismo

  if (!canEdit) {
    redirect('/dashboard/users')
  }

  // Determinar qué roles puede asignar
  let allowedRoles: string[] = []
  if (currentProfile.role === 'god') {
    allowedRoles = ['god', 'contratista', 'cliente', 'ayudante']
  } else if (currentProfile.role === 'contratista') {
    allowedRoles = ['cliente', 'ayudante']
  } else {
    // Si se está editando a sí mismo, no puede cambiar de rol
    allowedRoles = [userToEdit.role as string]
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
            Editar Usuario
          </h1>
          <p className="text-gray-600 mt-2">
            Modifica los datos de {userToEdit.full_name}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <UserEditForm
            user={userToEdit}
            allowedRoles={allowedRoles}
            currentUserId={currentProfile.id}
            canChangeRole={currentProfile.role === 'god' && currentProfile.id !== userToEdit.id}
          />
        </div>
      </div>
    </div>
  )
}