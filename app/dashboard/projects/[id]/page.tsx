import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Database, UserRole } from '@/types/database'
import StagesSection from '@/components/stages/StagesSection'
import { ChevronLeft, MapPin, User, HardHat, Calendar } from 'lucide-react'

type StageRow = {
  id: string
  name: string
  description: string | null
  status: 'pending' | 'progress' | 'completed' | 'approved' | 'rejected'
  order_index: number
  rejection_reason: string | null
}

type ProjectDetail = {
  id: string
  name: string
  description: string | null
  address: string | null
  status: string
  created_at: string
  client: { id: string; full_name: string; email: string } | null
  contractor: { id: string; full_name: string; email: string; company_name: string | null; logo_url: string | null } | null
  stages: StageRow[]
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

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single() as { data: { role: UserRole } | null }

  const role = profile?.role ?? 'ayudante'

  const { data: project } = await supabase
    .from('projects')
    .select(`
      id, name, description, address, status, created_at,
      client:profiles!projects_client_id_fkey(id, full_name, email),
      contractor:profiles!projects_contractor_id_fkey(id, full_name, email, company_name, logo_url),
      stages(id, name, description, status, order_index, rejection_reason)
    `)
    .eq('id', params.id)
    .single() as { data: ProjectDetail | null }

  if (!project) notFound()

  // Verificar acceso según rol
  const hasAccess =
    role === 'god' ||
    (project.client as any)?.id === session.user.id ||
    (project.contractor as any)?.id === session.user.id

  if (!hasAccess && role === 'ayudante') {
    const { data: teamEntry } = await supabase
      .from('project_team')
      .select('id')
      .eq('project_id', params.id)
      .eq('user_id', session.user.id)
      .single() as { data: { id: string } | null }
    if (!teamEntry) redirect('/dashboard/projects')
  } else if (!hasAccess) {
    redirect('/dashboard/projects')
  }

  const canManage = role === 'god' || role === 'contratista'
  const canApprove = role === 'cliente'

  const stages = (project.stages ?? []) as StageRow[]
  const totalStages = stages.length
  const approvedStages = stages.filter((s) => s.status === 'approved').length
  const completedStages = stages.filter((s) => s.status === 'completed').length
  const progress = totalStages > 0 ? Math.round(((approvedStages + completedStages) / totalStages) * 100) : 0

  const formattedDate = new Date(project.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors text-sm"
      >
        <ChevronLeft size={18} />
        Volver a Proyectos
      </Link>

      {/* Project header card */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800 leading-tight">{project.name}</h1>
          <span className={`badge ${statusColors[project.status ?? 'active']} shrink-0`}>
            {statusLabel[project.status ?? 'active']}
          </span>
        </div>

        {project.description && (
          <p className="text-gray-500 mb-4">{project.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
          {(project.client as any)?.full_name && (
            <div className="flex items-center gap-2 text-gray-600">
              <User size={16} className="text-primary-400 shrink-0" />
              <div>
                <span className="font-semibold block text-xs text-gray-400 uppercase tracking-wide">Cliente</span>
                {(project.client as any).full_name}
              </div>
            </div>
          )}
          {(project.contractor as any)?.full_name && (
            <div className="flex items-center gap-2 text-gray-600">
              <HardHat size={16} className="text-primary-400 shrink-0" />
              <div>
                <span className="font-semibold block text-xs text-gray-400 uppercase tracking-wide">Contratista</span>
                {(project.contractor as any).full_name}
              </div>
            </div>
          )}
          {project.address && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={16} className="text-primary-400 shrink-0" />
              <div>
                <span className="font-semibold block text-xs text-gray-400 uppercase tracking-wide">Dirección</span>
                {project.address}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={16} className="text-primary-400 shrink-0" />
            <div>
              <span className="font-semibold block text-xs text-gray-400 uppercase tracking-wide">Creado</span>
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {totalStages > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progreso general</span>
              <span>{approvedStages + completedStages}/{totalStages} etapas · {progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stages */}
      <StagesSection
        projectId={project.id}
        projectName={project.name}
        projectDescription={project.description}
        projectAddress={project.address}
        clientName={(project.client as any)?.full_name || null}
        contractorName={(project.contractor as any)?.full_name || null}
        contractorCompany={(project.contractor as any)?.company_name || null}
        contractorLogo={(project.contractor as any)?.logo_url || null}
        createdAt={project.created_at}
        initialStages={stages}
        userRole={role}
        userId={session.user.id}
        canManage={canManage}
        canApprove={canApprove}
      />
    </div>
  )
}