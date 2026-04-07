import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import type { Database } from '@/types/database'
import Link from 'next/link'
import StageGallery from '@/components/stages/StageGallery'
import ExternalLinksList from '@/components/stages/ExternalLinksList'
import AddExternalLinkButton from '@/components/stages/AddExternalLinkButton'
import StageSection from '@/components/stages/StagesSection'
import StagePDFButton from '@/components/stages/StagePDFButton'

export default async function StagePage({
  params,
}: {
  params: { id: string; stageId: string }
}) {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Obtener datos de la etapa
  const { data: stage } = await (supabase as any)
    .from('stages')
    .select(`
      *,
      project:projects (
        id,
        name,
        address,
        created_at,
        client:profiles!projects_client_id_fkey (full_name),
        contractor:profiles!projects_contractor_id_fkey (full_name, company_name, logo_url)
      )
    `)
    .eq('id', params.stageId)
    .single()

  if (!stage) {
    notFound()
  }

  // Obtener evidencias (fotos)
  const { data: evidences, count: evidenceCount } = await (supabase as any)
    .from('evidences')
    .select('*', { count: 'exact' })
    .eq('stage_id', params.stageId)
    .order('created_at', { ascending: false })

  // Obtener perfil del usuario actual
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Cast del role y verificar permisos de edición
  const userRole = profile.role as 'god' | 'contratista' | 'cliente' | 'ayudante'
  const canEdit = userRole === 'god' || userRole === 'contratista'

  // Helper para badges de estado
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'Pendiente', class: 'badge-pending', icon: 'clock' },
      progress: { label: 'En Progreso', class: 'badge-progress', icon: 'loader' },
      completed: { label: 'Completada', class: 'badge-completed', icon: 'check' },
      approved: { label: 'Aprobada', class: 'badge-approved', icon: 'check-circle' },
      rejected: { label: 'Rechazada', class: 'badge-rejected', icon: 'x-circle' },
    }
    return badges[status as keyof typeof badges] || badges.pending
  }

  const statusBadge = getStatusBadge(stage.status)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href="/dashboard/projects" className="text-gray-500 hover:text-gray-700">
          Proyectos
        </Link>
        <span className="text-gray-400">/</span>
        <Link 
          href={`/dashboard/projects/${params.id}`}
          className="text-gray-500 hover:text-gray-700"
        >
          {(stage.project as any)?.name}
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">{stage.name}</span>
      </div>

      {/* Header de la Etapa */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold flex items-center justify-center">
                {stage.order_index}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{stage.name}</h1>
            </div>
            <span className={`badge ${statusBadge.class} inline-flex items-center gap-1.5`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {statusBadge.icon === 'clock' && (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </>
                )}
                {statusBadge.icon === 'check-circle' && (
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="m9 11 3 3L22 4" />
                  </>
                )}
                {statusBadge.icon === 'loader' && (
                  <>
                    <line x1="12" x2="12" y1="2" y2="6" />
                    <line x1="12" x2="12" y1="18" y2="22" />
                    <line x1="4.93" x2="7.76" y1="4.93" y2="7.76" />
                    <line x1="16.24" x2="19.07" y1="16.24" y2="19.07" />
                  </>
                )}
              </svg>
              {statusBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <StagePDFButton
              stageId={params.stageId}
              stageName={stage.name}
              projectName={(stage.project as any)?.name || ''}
              projectAddress={(stage.project as any)?.address || null}
              clientName={(stage.project as any)?.client?.full_name || null}
              contractorName={(stage.project as any)?.contractor?.full_name || null}
              contractorCompany={(stage.project as any)?.contractor?.company_name || null}
              contractorLogo={(stage.project as any)?.contractor?.logo_url || null}
              projectCreatedAt={(stage.project as any)?.created_at || stage.created_at}
              stageDescription={stage.description}
              stageStatus={stage.status}
            />
            <Link
              href={`/dashboard/projects/${params.id}`}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Link>
          </div>
        </div>

        {stage.description && (
          <p className="text-gray-600 mb-4">{stage.description}</p>
        )}

        {/* Info del Proyecto */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Proyecto</p>
            <p className="font-medium text-gray-900">{(stage.project as any)?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cliente</p>
            <p className="font-medium text-gray-900">{(stage.project as any)?.client?.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Contratista</p>
            <p className="font-medium text-gray-900">
              {(stage.project as any)?.contractor?.company_name || (stage.project as any)?.contractor?.full_name}
            </p>
          </div>
        </div>

        {stage.rejection_reason && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-1">Motivo de rechazo:</p>
            <p className="text-sm text-red-600">{stage.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* Galería de Fotos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Evidencias Fotográficas
            <span className="text-sm font-normal text-gray-500">
              ({evidenceCount || 0} {evidenceCount === 1 ? 'foto' : 'fotos'})
            </span>
          </h2>
        </div>

        <StageGallery 
          stageId={params.stageId}
          projectId={params.id}
          evidences={evidences || []}
          canEdit={canEdit}
        />
      </div>

      {/* Documentos Externos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Documentos Externos
          </h2>
          {canEdit && <AddExternalLinkButton stageId={params.stageId} />}
        </div>

        <ExternalLinksList stageId={params.stageId} canEdit={canEdit} />
      </div>
    </div>
  )
}