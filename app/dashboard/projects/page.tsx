import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Database, UserRole } from '@/types/database'
import { FolderKanban, Plus, Search } from 'lucide-react'

type ProjectRow = {
  id: string
  name: string
  description: string | null
  address: string | null
  status: string | null
  created_at: string
  client: { full_name: string; email: string } | null
  contractor: { full_name: string; email: string } | null
  stages: { id: string; status: string }[]
}

const statusColors: Record<string, string> = {
  active: 'badge-progress',
  completed: 'badge-completed',
  pending: 'badge-pending',
  paused: 'badge-rejected',
  cancelled: 'badge-rejected',
}

const statusLabel: Record<string, string> = {
  active: 'Activo',
  completed: 'Completado',
  pending: 'Pendiente',
  paused: 'Pausado',
  cancelled: 'Cancelado',
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string }
}) {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single() as { data: { role: UserRole } | null }

  const role = profile?.role ?? 'ayudante'

  let query = supabase
    .from('projects')
    .select(`
      id, name, description, address, status, created_at,
      client:profiles!projects_client_id_fkey(full_name, email),
      contractor:profiles!projects_contractor_id_fkey(full_name, email),
      stages(id, status)
    `)

  if (role === 'cliente') {
    query = query.eq('client_id', session.user.id)
  } else if (role === 'contratista') {
    query = query.eq('contractor_id', session.user.id)
  } else if (role === 'ayudante') {
    const { data: teamProjects } = await supabase
      .from('project_team')
      .select('project_id')
      .eq('user_id', session.user.id) as { data: { project_id: string }[] | null }
    const ids = teamProjects?.map((t) => t.project_id) ?? []
    if (ids.length === 0) {
      query = query.eq('id', '00000000-0000-0000-0000-000000000000')
    } else {
      query = query.in('id', ids)
    }
  }

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status)
  }

  const { data: projects } = await query.order('created_at', { ascending: false }) as { data: ProjectRow[] | null }

  const filtered = searchParams.q
    ? projects?.filter((p) =>
        p.name.toLowerCase().includes(searchParams.q!.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchParams.q!.toLowerCase()) ||
        (p.client as any)?.full_name?.toLowerCase().includes(searchParams.q!.toLowerCase())
      )
    : projects

  const tabs = [
    { key: 'all', label: 'Todos' },
    { key: 'active', label: 'Activos' },
    { key: 'completed', label: 'Completados' },
    { key: 'paused', label: 'Pausados' },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Proyectos</h1>
          <p className="text-white/70 text-sm mt-1">{filtered?.length ?? 0} proyecto(s)</p>
        </div>
        {role === 'god' && (
          <Link href="/dashboard/projects/new" className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            Nuevo Proyecto
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white/10 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <form>
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q}
              placeholder="Buscar por nombre, cliente..."
              className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50 text-sm"
            />
          </form>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/dashboard/projects?status=${tab.key}${searchParams.q ? `&q=${searchParams.q}` : ''}`}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                (searchParams.status ?? 'all') === tab.key
                  ? 'bg-white text-primary-600'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Projects grid */}
      {!filtered || filtered.length === 0 ? (
        <div className="card text-center py-16">
          <FolderKanban size={52} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay proyectos</p>
          {role === 'god' && (
            <Link href="/dashboard/projects/new" className="btn btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={16} />
              Crear Primer Proyecto
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((project) => {
            const stagesArr = project.stages ?? []
            const totalStages = stagesArr.length
            const doneStages = stagesArr.filter(
              (s) => s.status === 'approved' || s.status === 'completed'
            ).length
            const progress = totalStages > 0 ? Math.round((doneStages / totalStages) * 100) : 0

            return (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="card group hover:scale-[1.01] transition-transform duration-200 block"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-800 leading-tight group-hover:text-primary-500 transition-colors">
                    {project.name}
                  </h3>
                  <span className={`badge ${statusColors[project.status ?? 'active']} ml-2 shrink-0`}>
                    {statusLabel[project.status ?? 'active']}
                  </span>
                </div>

                {project.description && (
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{project.description}</p>
                )}

                {project.address && (
                  <p className="text-gray-400 text-xs mb-3 flex items-center gap-1">
                    <span>📍</span> {project.address}
                  </p>
                )}

                <div className="space-y-1 text-sm mb-4">
                  {(project.client as any)?.full_name && (
                    <p className="text-gray-600">
                      <span className="font-semibold">Cliente:</span>{' '}
                      {(project.client as any).full_name}
                    </p>
                  )}
                  {(project.contractor as any)?.full_name && (
                    <p className="text-gray-600">
                      <span className="font-semibold">Contratista:</span>{' '}
                      {(project.contractor as any).full_name}
                    </p>
                  )}
                </div>

                {totalStages > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progreso</span>
                      <span>
                        {doneStages}/{totalStages} etapas · {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {totalStages === 0 && (
                  <p className="text-gray-300 text-xs italic">Sin etapas aún</p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
