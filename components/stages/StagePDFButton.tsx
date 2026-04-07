'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

interface StagePDFButtonProps {
  stageId: string
  stageName: string
  projectName: string
  projectAddress: string | null
  clientName: string | null
  contractorName: string | null
  contractorCompany: string | null
  contractorLogo: string | null
  projectCreatedAt: string
  stageDescription: string | null
  stageStatus: string
}

export default function StagePDFButton({
  stageId,
  stageName,
  projectName,
  projectAddress,
  clientName,
  contractorName,
  contractorCompany,
  contractorLogo,
  projectCreatedAt,
  stageDescription,
  stageStatus,
}: StagePDFButtonProps) {
  const [generating, setGenerating] = useState(false)
  const supabase = createClientComponentClient<Database>()

  const handleGeneratePDF = async () => {
    setGenerating(true)
    try {
      const [{ data: evidences }, { data: links }] = await Promise.all([
        (supabase as any)
          .from('evidences')
          .select('id, image_url, caption')
          .eq('stage_id', stageId)
          .order('created_at', { ascending: false }),
        (supabase as any)
          .from('stage_links')
          .select('id, link_title, link_url, link_type, description')
          .eq('stage_id', stageId)
          .order('created_at', { ascending: false }),
      ])

      const { generateStagePDF } = await import('@/lib/pdf-generator')

      await generateStagePDF(
        {
          name: projectName,
          description: null,
          address: projectAddress,
          clientName,
          contractorName,
          contractorCompany,
          contractorLogo,
          createdAt: projectCreatedAt,
        },
        {
          id: stageId,
          name: stageName,
          description: stageDescription,
          status: stageStatus,
        },
        evidences || [],
        links || []
      )
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={handleGeneratePDF}
      disabled={generating}
      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {generating ? 'Generando...' : 'Generar PDF'}
    </button>
  )
}
