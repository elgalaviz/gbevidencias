import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database, UserRole } from '@/types/database'
import ProjectForm from '@/components/projects/ProjectForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

type ProfileOption = { id: string; full_name: string; email: string }

export default async function NewProjectPage() {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single() as { data: { role: UserRole } | null }

  // Solo GOD puede crear proyectos
// Solo GOD y Contratistas pueden crear proyectos
if (profile?.role !== 'god' && profile?.role !== 'contratista') redirect('/dashboard/projects')

  const { data: clients } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'cliente')
    .order('full_name') as { data: ProfileOption[] | null }

  const { data: contractors } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'contratista')
    .order('full_name') as { data: ProfileOption[] | null }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-[#333] mb-6 transition-colors text-sm"
      >
        <ChevronLeft size={18} />
        Volver a Proyectos
      </Link>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Nuevo Proyecto</h1>
        <p className="text-gray-500 text-sm mb-6">Completa la información del proyecto</p>

        <ProjectForm
  clients={clients ?? []}
  contractors={contractors ?? []}
  userId={session.user.id}
  userRole={profile.role as 'god' | 'contratista'} // AGREGAR ESTA LÍNEA
/>
      </div>
    </div>
  )
}
