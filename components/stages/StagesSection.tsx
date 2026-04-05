'use client'

import { useState, useCallback } from 'react'
import { Plus, CheckCircle, XCircle, Clock, AlertCircle, ChevronRight, RefreshCw, Camera, ChevronDown, FileText, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import StageFormModal from './StageFormModal'
import ApprovalModal from './ApprovalModal'
import EvidenceUpload from '@/components/evidences/EvidenceUpload'
import EvidenceGallery from '@/components/evidences/EvidenceGallery'
import { generateStagePDF, generateProjectPDF } from '@/lib/pdf-generator'

type StageStatus = 'pending' | 'progress' | 'completed' | 'approved' | 'rejected'
type UserRole = 'god' | 'cliente' | 'contratista' | 'ayudante'

type Evidence = {
  id: string
  image_url: string
  image_path: string
  caption: string | null
  uploaded_by: string
}

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
  contractorCompany: string | null  // AGREGAR
  contractorLogo: string | null     // AGREGAR
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

const nextStatus: Partial<Record<StageStatus, StageStatus>> = {
  pending: 'progress',
  progress: 'completed',
}

const nextStatusLabel: Partial<Record<StageStatus, string>> = {
  pending: 'Iniciar',
  progress: 'Completar',
}

export default function StagesSection({
  projectId, projectName, projectDescription, projectAddress, clientName, contractorName,
  contractorCompany, contractorLogo, createdAt,  // AGREGAR ESTOS
  initialStages, userRole, userId, canManage, canApprove,
}: StagesSectionProps) {
  const supabase = createClient()
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [showForm, setShowForm] = useState(false)
  const [approval, setApproval] = useState<{ stageId: string; stageName: string; action: 'approve' | 'reject' } | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null)

  // Evidencias por etapa: { [stageId]: Evidence[] | 'loading' }
  const [evidences, setEvidences] = useState<Record<string, Evidence[] | 'loading'>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState<string | null>(null)

  const canUpload = userRole === 'god' || userRole === 'contratista' || userRole === 'ayudante'

  const loadEvidences = useCallback(async (stageId: string) => {
    if (evidences[stageId] && evidences[stageId] !== 'loading') return

    setEvidences((prev) => ({ ...prev, [stageId]: 'loading' }))
    const { data } = await (supabase.from('evidences') as any)
      .select('id, image_url, image_path, caption, uploaded_by')
      .eq('stage_id', stageId)
      .order('created_at', { ascending: true })

    setEvidences((prev) => ({ ...prev, [stageId]: data ?? [] }))
  }, [evidences, supabase])

  const toggleExpand = (stageId: string) => {
    if (expandedId === stageId) {
      setExpandedId(null)
      setShowUpload(null)
    } else {
      setExpandedId(stageId)
      setShowUpload(null)
      loadEvidences(stageId)
    }
  }

  const handleStageCreated = (stage: Stage) => setStages((prev) => [...prev, stage])

  const handleStatusAdvance = async (stage: Stage) => {
    const next = nextStatus[stage.status]
    if (!next) return
    setUpdatingId(stage.id)
    const { error } = await (supabase.from('stages') as any).update({ status: next }).eq('id', stage.id)
    if (!error) setStages((prev) => prev.map((s) => s.id === stage.id ? { ...s, status: next } : s))
    setUpdatingId(null)
  }

  const handleApprovalDone = (stageId: string, newStatus: string, rejectionReason?: string) => {
    setStages((prev) =>
      prev.map((s) => s.id === stageId ? { ...s, status: newStatus as StageStatus, rejection_reason: rejectionReason ?? null } : s)
    )
  }

  const handleUploaded = (stageId: string, newEvs: Evidence[]) => {
    setEvidences((prev) => ({
      ...prev,
      [stageId]: [...(Array.isArray(prev[stageId]) ? (prev[stageId] as Evidence[]) : []), ...newEvs],
    }))
    setShowUpload(null)
  }

  const handleDeleted = (stageId: string, evId: string) => {
    setEvidences((prev) => ({
      ...prev,
      [stageId]: Array.isArray(prev[stageId])
        ? (prev[stageId] as Evidence[]).filter((e) => e.id !== evId)
        : [],
    }))
  }

  // Generar PDF de una etapa
  const handleGenerateStagePDF = async (stage: Stage) => {
    setGeneratingPDF(stage.id)
    
    // Cargar evidencias si no están cargadas
    await loadEvidences(stage.id)
    
    const stageEvs = evidences[stage.id]
    const evidenceList = Array.isArray(stageEvs) ? stageEvs : []

    try {
      await generateStagePDF(
  {
    name: projectName,
    description: projectDescription,
    address: projectAddress,
    clientName,
    contractorName,
    contractorCompany,  // AGREGAR
    contractorLogo,     // AGREGAR
    createdAt,
  },
        stage,
        evidenceList
      )
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar PDF. Por favor intenta de nuevo.')
    } finally {
      setGeneratingPDF(null)
    }
  }

  // Generar PDF global del proyecto
  const handleGenerateProjectPDF = async () => {
    setGeneratingPDF('global')

    // Cargar todas las evidencias
    const allEvidencesData: Record<string, Evidence[]> = {}
    
    for (const stage of stages) {
      await loadEvidences(stage.id)
      const stageEvs = evidences[stage.id]
      allEvidencesData[stage.id] = Array.isArray(stageEvs) ? stageEvs : []
    }

    try {
      await generateProjectPDF(
        {
          name: projectName,
    description: projectDescription,
    address: projectAddress,
    clientName,
    contractorName,
    contractorCompany,  // AGREGAR
    contractorLogo,     // AGREGAR
    createdAt,
        },
        stages,
        allEvidencesData
      )
    } catch (error) {
      console.error('Error generando PDF global:', error)
      alert('Error al generar PDF. Por favor intenta de nuevo.')
    } finally {
      setGeneratingPDF(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">
          Etapas
          <span className="ml-2 text-white/50 text-base font-normal">({stages.length})</span>
        </h2>
        
        <div className="flex gap-2">
          {/* Botón PDF Global */}
          {stages.length > 0 && (
            <button
              onClick={handleGenerateProjectPDF}
              disabled={generatingPDF === 'global'}
              className="btn btn-secondary flex items-center gap-2 text-sm py-2"
            >
              <Download size={16} />
              {generatingPDF === 'global' ? 'Generando...' : 'PDF Completo'}
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
          {[...stages].sort((a, b) => a.order_index - b.order_index).map((stage, idx) => {
            const cfg = statusConfig[stage.status]
            const canAdvance = canManage && (stage.status === 'pending' || stage.status === 'progress')
            const canApproveThis = canApprove && stage.status === 'completed'
            const isExpanded = expandedId === stage.id
            const stageEvs = evidences[stage.id]
            const evCount = Array.isArray(stageEvs) ? stageEvs.length : 0
            const isLoadingEvs = stageEvs === 'loading'

            return (
              <div key={stage.id} className="card overflow-hidden">
                {/* Stage header — clickable to expand */}
                <div
                  className="flex items-start gap-4 cursor-pointer"
                  onClick={() => toggleExpand(stage.id)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-800">{stage.name}</h3>
                      <span className={`badge ${cfg.badge} flex items-center gap-1`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                      {evCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Camera size={12} />
                          {evCount}
                        </span>
                      )}
                    </div>
                    {stage.description && (
                      <p className="text-gray-500 text-sm">{stage.description}</p>
                    )}
                  </div>

                  <ChevronDown
                    size={18}
                    className={`text-gray-400 shrink-0 mt-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Motivo de rechazo */}
                {stage.status === 'rejected' && stage.rejection_reason && (
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-700 mt-3 ml-12">
                    <span className="font-semibold">Motivo de rechazo: </span>
                    {stage.rejection_reason}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-3 ml-12 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  {canAdvance && (
                    <button
                      onClick={() => handleStatusAdvance(stage)}
                      disabled={updatingId === stage.id}
                      className="btn btn-secondary text-xs py-1.5 flex items-center gap-1.5"
                    >
                      <ChevronRight size={14} />
                      {updatingId === stage.id ? 'Actualizando...' : nextStatusLabel[stage.status]}
                    </button>
                  )}
                  {canApproveThis && (
                    <>
                      <button
                        onClick={() => setApproval({ stageId: stage.id, stageName: stage.name, action: 'approve' })}
                        className="btn btn-success text-xs py-1.5 flex items-center gap-1.5"
                      >
                        <CheckCircle size={14} />
                        Aprobar
                      </button>
                      <button
                        onClick={() => setApproval({ stageId: stage.id, stageName: stage.name, action: 'reject' })}
                        className="btn btn-danger text-xs py-1.5 flex items-center gap-1.5"
                      >
                        <XCircle size={14} />
                        Rechazar
                      </button>
                    </>
                  )}
                  {canUpload && isExpanded && (
                    <button
                      onClick={() => setShowUpload(showUpload === stage.id ? null : stage.id)}
                      className="btn btn-secondary text-xs py-1.5 flex items-center gap-1.5"
                    >
                      <Camera size={14} />
                      {showUpload === stage.id ? 'Cancelar' : 'Subir fotos'}
                    </button>
                  )}
                  {/* Botón PDF por etapa */}
                  <button
                    onClick={() => handleGenerateStagePDF(stage)}
                    disabled={generatingPDF === stage.id}
                    className="btn btn-secondary text-xs py-1.5 flex items-center gap-1.5"
                  >
                    <FileText size={14} />
                    {generatingPDF === stage.id ? 'Generando...' : 'PDF Etapa'}
                  </button>
                </div>

                {/* Expanded: evidences */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 ml-12" onClick={(e) => e.stopPropagation()}>
                    {/* Upload form */}
                    {showUpload === stage.id && (
                      <div className="mb-4">
                        <EvidenceUpload
                          stageId={stage.id}
                          projectId={projectId}
                          userId={userId}
                          onUploaded={(evs) => handleUploaded(stage.id, evs)}
                        />
                      </div>
                    )}

                    {/* Gallery */}
                    {isLoadingEvs ? (
                      <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                        <RefreshCw size={14} className="animate-spin" />
                        Cargando evidencias...
                      </div>
                    ) : (
                      <EvidenceGallery
                        evidences={Array.isArray(stageEvs) ? stageEvs : []}
                        userId={userId}
                        userRole={userRole}
                        onDeleted={(evId) => handleDeleted(stage.id, evId)}
                      />
                    )}
                  </div>
                )}
              </div>
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

      {approval && (
        <ApprovalModal
          stageId={approval.stageId}
          stageName={approval.stageName}
          action={approval.action}
          userId={userId}
          onClose={() => setApproval(null)}
          onDone={handleApprovalDone}
        />
      )}
    </div>
  )
}