'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

interface StagePDFButtonProps {
  stageId: string
  stageName: string
  projectName: string
}

export default function StagePDFButton({ stageId, stageName, projectName }: StagePDFButtonProps) {
  const [generating, setGenerating] = useState(false)
  const supabase = createClientComponentClient<Database>()

  const handleGeneratePDF = async () => {
    setGenerating(true)
    try {
      const { data: links } = await (supabase as any)
        .from('stage_links')
        .select('*')
        .eq('stage_id', stageId)
        .order('created_at', { ascending: false })

      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let y = 20

      // Título del proyecto
      doc.setFontSize(11)
      doc.setTextColor(100, 100, 100)
      doc.text(`Proyecto: ${projectName}`, margin, y)
      y += 8

      // Título de la etapa
      doc.setFontSize(18)
      doc.setTextColor(30, 30, 30)
      doc.setFont('helvetica', 'bold')
      doc.text(stageName, margin, y)
      y += 8

      // Fecha
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.setFont('helvetica', 'normal')
      const fecha = new Date().toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
      doc.text(`Generado el ${fecha}`, margin, y)
      y += 10

      // Línea separadora
      doc.setDrawColor(220, 220, 220)
      doc.line(margin, y, pageWidth - margin, y)
      y += 10

      // Sección de links
      doc.setFontSize(13)
      doc.setTextColor(60, 60, 60)
      doc.setFont('helvetica', 'bold')
      doc.text('Documentos Externos', margin, y)
      y += 10

      if (!links || links.length === 0) {
        doc.setFontSize(11)
        doc.setTextColor(150, 150, 150)
        doc.setFont('helvetica', 'italic')
        doc.text('No hay documentos externos registrados.', margin, y)
      } else {
        links.forEach((link: any, index: number) => {
          if (y > 260) {
            doc.addPage()
            y = 20
          }

          // Número y nombre del archivo
          doc.setFontSize(11)
          doc.setTextColor(30, 30, 30)
          doc.setFont('helvetica', 'bold')
          doc.text(`${index + 1}. ${link.link_title}`, margin, y)
          y += 6

          // URL como texto clicable
          doc.setFontSize(10)
          doc.setTextColor(37, 99, 235)
          doc.setFont('helvetica', 'normal')
          const urlText = link.link_url
          const urlWidth = pageWidth - margin * 2
          const urlLines = doc.splitTextToSize(urlText, urlWidth)
          doc.textWithLink(urlLines[0], margin + 4, y, { url: link.link_url })
          if (urlLines.length > 1) {
            y += 5
            doc.text(urlLines.slice(1).join(''), margin + 4, y)
          }
          y += 6

          // Descripción si existe
          if (link.description) {
            doc.setFontSize(10)
            doc.setTextColor(100, 100, 100)
            const descLines = doc.splitTextToSize(link.description, pageWidth - margin * 2 - 4)
            doc.text(descLines, margin + 4, y)
            y += descLines.length * 5 + 2
          }

          y += 4
        })
      }

      // Footer
      doc.setFontSize(9)
      doc.setTextColor(180, 180, 180)
      doc.setFont('helvetica', 'normal')
      doc.text('ProManager', margin, doc.internal.pageSize.getHeight() - 10)

      const fileName = `${stageName.replace(/\s+/g, '_')}_documentos.pdf`
      doc.save(fileName)
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
