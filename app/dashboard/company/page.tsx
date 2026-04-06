import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database, Profile } from '@/types/database'
import CompanySettingsForm from '@/components/settings/CompanySettingsForm'
import { Building2 } from 'lucide-react'

export default async function CompanyPage() {
  const supabase = createServerComponentClient<Database>({ cookies })

  // Verificar autenticación
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single() as { data: Profile | null }

  if (!profile) {
    redirect('/login')
  }

  // Solo contratistas pueden acceder
  if (profile.role !== 'contratista') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tu Empresa
              </h1>
              <p className="text-gray-600">
                Gestiona la información de tu empresa
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <CompanySettingsForm profile={profile} />
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📄 Logo en PDFs</h3>
            <p className="text-sm text-blue-700">
              El logo que subas aparecerá automáticamente en todos los PDFs que generes de tus proyectos.
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">🏢 Información Profesional</h3>
            <p className="text-sm text-purple-700">
              Esta información se mostrará en reportes y comunicaciones con tus clientes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}