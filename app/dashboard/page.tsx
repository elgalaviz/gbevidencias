import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database, UserRole } from '@/types/database'
import { FolderKanban, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single() as { data: { full_name: string; email: string; role: UserRole } | null }

  // Obtener proyectos según rol
  let projectsQuery = supabase
    .from('projects')
    .select(`
      *,
      client:profiles!projects_client_id_fkey(full_name, email),
      contractor:profiles!projects_contractor_id_fkey(full_name, email),
      stages(id, status)
    `)

  if (profile?.role === 'cliente') {
    projectsQuery = projectsQuery.eq('client_id', session.user.id)
  } else if (profile?.role === 'contratista') {
    projectsQuery = projectsQuery.eq('contractor_id', session.user.id)
  } else if (profile?.role === 'ayudante') {
    const { data: teamProjects } = await supabase
      .from('project_team')
      .select('project_id')
      .eq('user_id', session.user.id) as { data: { project_id: string }[] | null }
    const ids = teamProjects?.map((t) => t.project_id) ?? []
    if (ids.length === 0) {
      projectsQuery = projectsQuery.eq('id', '00000000-0000-0000-0000-000000000000')
    } else {
      projectsQuery = projectsQuery.in('id', ids)
    }
  }

  type ProjectRow = {
    id: string
    name: string
    description: string | null
    status: string | null
    client: { full_name: string; email: string } | null
    contractor: { full_name: string; email: string } | null
    stages: { id: string; status: string }[]
  }
  const { data: projects } = await projectsQuery.order('created_at', { ascending: false }) as { data: ProjectRow[] | null }

  const total = projects?.length ?? 0
  const active = projects?.filter((p) => p.status === 'active').length ?? 0
  const completed = projects?.filter((p) => p.status === 'completed').length ?? 0
  const pending = projects?.filter((p) => p.status === 'pending').length ?? 0

  const statusColors: Record<string, string> = {
    active: 'badge-progress',
    completed: 'badge-completed',
    pending: 'badge-pending',
    paused: 'badge-rejected',
  }

  const statusLabel: Record<string, string> = {
    active: 'Activo',
    completed: 'Completado',
    pending: 'Pendiente',
    paused: 'Pausado',
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#333] mb-1">
          Bienvenido, {profile?.full_name ?? 'Usuario'}
        </h1>
        <p className="text-gray-500 text-sm">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <FolderKanban size={22} className="text-primary-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{total}</p>
            <p className="text-gray-500 text-xs">Total</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock size={22} className="text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{active}</p>
            <p className="text-gray-500 text-xs">Activos</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle size={22} className="text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{completed}</p>
            <p className="text-gray-500 text-xs">Completados</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <AlertCircle size={22} className="text-yellow-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{pending}</p>
            <p className="text-gray-500 text-xs">Pendientes</p>
          </div>
        </div>
      </div>

      {/* Projects list */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#333]">Proyectos Recientes</h2>
        {(profile?.role === 'god' || profile?.role === 'contratista') && (
          <Link 
            href="/dashboard/projects/new"
            className="btn btn-primary"
          >
            + Nuevo Proyecto
          </Link>
        )}
      </div>

      {(!projects || projects.length === 0) ? (
        <div className="card text-center py-12">
          <FolderKanban size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay proyectos disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => {
            const stagesArr = (project.stages as any[]) ?? []
            const totalStages = stagesArr.length
            const doneStages = stagesArr.filter((s) => s.status === 'approved' || s.status === 'completed').length
            const progress = totalStages > 0 ? Math.round((doneStages / totalStages) * 100) : 0

            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <div className="card group hover:scale-[1.01] transition-transform duration-200 cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-800 leading-tight">{project.name}</h3>
                    <span className={`badge ${statusColors[project.status ?? 'pending']} ml-2 shrink-0`}>
                      {statusLabel[project.status ?? 'pending']}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{project.description}</p>
                  )}

                  <div className="space-y-1 text-sm mb-4">
                    {(project.client as any)?.full_name && (
                      <p className="text-gray-600">
                        <span className="font-semibold">Cliente:</span> {(project.client as any).full_name}
                      </p>
                    )}
                    {(project.contractor as any)?.full_name && (
                      <p className="text-gray-600">
                        <span className="font-semibold">Contratista:</span> {(project.contractor as any).full_name}
                      </p>
                    )}
                  </div>

                  {totalStages > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progreso</span>
                        <span>{doneStages}/{totalStages} etapas</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}