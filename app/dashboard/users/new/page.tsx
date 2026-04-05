import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database, UserRole } from '@/types/database'
import UserForm from '@/components/users/UserForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NewUserPage() {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single() as { data: { role: UserRole } | null }

  if (profile?.role !== 'god' && profile?.role !== 'contratista') redirect('/dashboard')
return (
  <div className="p-6 max-w-2xl mx-auto">
    <Link
      href="/dashboard/users"
      className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors text-sm"
    >
      <ChevronLeft size={18} />
      Volver a Usuarios
    </Link>

    <div className="card">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Nuevo Usuario</h1>
      <p className="text-gray-500 text-sm mb-6">
        El usuario recibirá acceso inmediato (sin necesidad de confirmar email)
      </p>
      <UserForm userRole={profile.role as 'god' | 'contratista'} />
    </div>
  </div>
)
}