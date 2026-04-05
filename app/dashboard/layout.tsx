import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database, UserRole } from '@/types/database'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', session.user.id)
    .single() as { data: { full_name: string; email: string; role: UserRole } | null }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userRole={profile?.role ?? 'ayudante'}
        userName={profile?.full_name ?? session.user.email ?? ''}
      />
      <main className="flex-1 overflow-auto lg:ml-72">
        {children}
      </main>
    </div>
  )
}
