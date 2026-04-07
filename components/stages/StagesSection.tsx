'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Camera, Download, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import StageFormModal from './StageFormModal'
import { generateProjectPDF } from '@/lib/pdf-generator'

type StageStatus = 'pending' | 'progress' | 'completed' | 'approved' | 'rejected'
type UserRole = 'god' | 'cliente' | 'contratista' | 'ayudante'

type Stage = {
  id: string
  name: string
  description: string | null
  status: StageStatus
  order_index: number
  rejection_reason: string | null
}

interface StagesSectionProps {
  projectId: string
  projectName: string
  projectDescription: string | null
  projectAddress: string | null
  clientName: string | null
  contractorName: string | null
  contractorCompany: string | null
  contractorLogo: string | null
  createdAt: string
  initialStages: Stage[]
  userRole: UserRole
  userId: string
  canManage: boolean
  canApprove: boolean
}

const statusConfig: Record<StageStatus, { label: string; badge: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pendiente',   badge: 'badge-pending',   icon: <Clock size={14} /> },
  progress:  { label: 'En Progreso', badge: 'badge-progress',  icon: <RefreshCw size={14} /> },
  completed: { label: 'Completada',  badge: 'badge-completed', icon: <CheckCircle size={14} /> },
  approved:  { label: 'Aprobada',    badge: 'badge-approved',  icon: <CheckCircle size={14} /> },
  rejected:  { label: 'Rechazada',   badge: 'badge-rejected',  icon: <XCircle size={14} /> },
}

export default function StagesSection({
  projectId, projectName, projectDescription, projectAddress, clientName, contractorName,
  contractorCompany, contractorLogo, createdAt,
  initialStages, userRole, canManage,
}: StagesSectionProps) {
  const supabase = createClient()
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [showForm, setShowForm] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [evidenceCounts, setEvidenceCounts] = useState<Record<string, number>>({})

  const handleStageCreated = (stage: Stage) => setStages((prev) => [...prev, stage])

  // Cargar conteo de evidencias
  useEffect(() => {
    const loadEvidenceCounts = async () => {
      const counts: Record<string, number> = {}
      
      for (const stage of stages) {
        const { count } = await (supabase.from('evidences') as any)
          .select('*', { count: 'exact', head: true })
          .eq('stage_id', stage.id)
        
        counts[stage.id] = count || 0
      }
      
      setEvidenceCounts(counts)
    }

    if (stages.length > 0) {
      loadEvidenceCounts()
    }
  }, [stages, supabase])

  // Generar PDF global del proyecto
  const handleGenerateProjectPDF = async () => {
    setGeneratingPDF(true)

    try {
      const allEvidencesData: Record<string, any[]> = {}
      const allLinksData: Record<string, any[]> = {}

      for (const stage of stages) {
        const [{ data: evData }, { data: linkData }] = await Promise.all([
          (supabase.from('evidences') as any)
            .select('id, image_url, image_path, caption, uploaded_by')
            .eq('stage_id', stage.id)
            .order('created_at', { ascending: true }),
          (supabase.from('stage_links') as any)
            .select('id, link_title, link_url, link_type, description')
            .eq('stage_id', stage.id)
            .order('created_at', { ascending: false }),
        ])
        allEvidencesData[stage.id] = evData ?? []
        allLinksData[stage.id] = linkData ?? []
      }

      await generateProjectPDF(
        {
          name: projectName,
          description: projectDescription,
          address: projectAddress,
          clientName,
          contractorName,
          contractorCompany,
          contractorLogo,
          createdAt,
        },
        stages,
        allEvidencesData,
        allLinksData
      )
    } catch (error) {
      console.error('Error generando PDF global:', error)
      alert('Error al generar PDF. Por favor intenta de nuevo.')
    } finally {
      setGeneratingPDF(false)
    }
  }

  // Ordenar etapas
  const sortedStages = [...stages].sort((a, b) => a.order_index - b.order_index)

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">
          Etapas
          <span className="ml-2 text-white/50 text-base font-normal">({stages.length})</span>
        </h2>
        
        <div className="flex gap-2">
          {stages.length > 0 && (
            <button
              onClick={handleGenerateProjectPDF}
              disabled={generatingPDF}
              className="btn btn-secondary flex items-center gap-2 text-sm py-2"
            >
              <Download size={16} />
              {generatingPDF ? 'Generando...' : 'PDF Completo'}
            </button>
          )}

          {canManage && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary flex items-center gap-2 text-sm py-2"
            >
              <Plus size={16} />
              Nueva Etapa
            </button>
          )}
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="card text-center py-12">
          <AlertCircle size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No hay etapas creadas aún</p>
          {canManage && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary mt-4 inline-flex items-center gap-2 text-sm">
              <Plus size={16} />
              Crear Primera Etapa
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedStages.map((stage: Stage, idx: number) => {
            const cfg = statusConfig[stage.status]
            const evCount = evidenceCounts[stage.id] || 0

            return (
              <Link
                key={stage.id}
                href={`/dashboard/projects/${projectId}/stages/${stage.id}`}
                className="card overflow-hidden block hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{stage.name}</h3>
                      <span className={`badge ${cfg.badge} flex items-center gap-1`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                      {evCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          <Camera size={12} />
                          {evCount} {evCount === 1 ? 'foto' : 'fotos'}
                        </span>
                      )}
                    </div>
                    {stage.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">{stage.description}</p>
                    )}

                    {stage.status === 'rejected' && stage.rejection_reason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <span className="font-semibold">Motivo: </span>
                        {stage.rejection_reason}
                      </div>
                    )}
                  </div>

                  <ChevronRight size={20} className="text-gray-400 shrink-0 mt-2" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {showForm && (
        <StageFormModal
          projectId={projectId}
          nextOrder={stages.length}
          onClose={() => setShowForm(false)}
          onCreated={handleStageCreated}
        />
      )}
    </div>
  )
}