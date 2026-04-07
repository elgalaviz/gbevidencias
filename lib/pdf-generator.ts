import jsPDF from 'jspdf'

type Evidence = {
  id: string
  image_url: string
  caption: string | null
}

type Stage = {
  id: string
  name: string
  description: string | null
  status: string
}

type StageLink = {
  id: string
  link_title: string
  link_url: string
  link_type: string | null
  description: string | null
}

type ProjectData = {
  name: string
  description: string | null
  address: string | null
  clientName: string | null
  contractorName: string | null
  contractorCompany: string | null
  contractorLogo: string | null
  createdAt: string
}

// Función para cargar imagen como base64
async function loadImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error cargando imagen:', error)
    throw error
  }
}

// Función para dibujar header profesional en cada página
async function drawHeader(
  doc: jsPDF,
  projectName: string,
  companyName: string,
  logoUrl?: string | null
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Rectángulo del header con sombra sutil
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.5)
  doc.setFillColor(252, 252, 254)
  doc.rect(10, 10, pageWidth - 20, 35, 'FD')
  
  // Nombre de empresa/contratista (izquierda)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(79, 70, 229) // primary color
  doc.text(companyName || 'Contratista', 15, 22)
  
  // Logo (derecha) - si existe
  if (logoUrl) {
    try {
      const logoData = await loadImageAsBase64(logoUrl)
      doc.addImage(logoData, 'PNG', pageWidth - 45, 12, 30, 20, undefined, 'FAST')
    } catch (error) {
      console.log('Logo no disponible, continuando sin logo')
    }
  }
  
  // Línea separadora
  doc.setDrawColor(200, 200, 220)
  doc.setLineWidth(0.3)
  doc.line(15, 28, pageWidth - 15, 28)
  
  // Nombre del proyecto (abajo izquierda)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  const maxProjectNameWidth = pageWidth - 80
  const truncatedProjectName = doc.splitTextToSize(projectName, maxProjectNameWidth)[0]
  doc.text(truncatedProjectName, 15, 37)
  
  // Fecha (abajo derecha)
  const fecha = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
  doc.setTextColor(100, 100, 100)
  doc.text(fecha, pageWidth - 15, 37, { align: 'right' })
  
  // Resetear estilos
  doc.setFont('helvetica', 'normal')
}

// Generar PDF de una etapa específica
export async function generateStagePDF(
  projectData: ProjectData,
  stage: Stage,
  evidences: Evidence[],
  links: StageLink[] = []
) {
  const doc = new jsPDF()
  const companyName = projectData.contractorCompany || projectData.contractorName || 'Empresa Contratista'
  const projectName = projectData.name || 'Proyecto Sin Nombre'
  const stageName = stage.name || 'Etapa'

  // ── Portada ──────────────────────────────────────────────────────────────
  doc.setFillColor(79, 70, 229)
  doc.rect(0, 0, 210, 297, 'F')

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(stageName, 105, 115, { align: 'center' })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(projectName, 105, 130, { align: 'center' })

  doc.setFontSize(11)
  doc.text(new Date().toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric'
  }), 105, 145, { align: 'center' })

  doc.setFontSize(11)
  doc.text(companyName, 105, 160, { align: 'center' })

  // ── Página de información ─────────────────────────────────────────────────
  doc.addPage()
  await drawHeader(doc, projectName, companyName, projectData.contractorLogo)
  let yPos = 60

  // Título de etapa
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40, 40, 40)
  doc.text(stageName, 20, yPos)
  yPos += 10

  // Estado
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Estado: ', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(79, 70, 229)
  doc.text(getStatusLabel(stage.status), 40, yPos)
  yPos += 10

  // Descripción de la etapa
  if (stage.description) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    const lines = doc.splitTextToSize(stage.description, 170)
    doc.text(lines, 20, yPos)
    yPos += lines.length * 6 + 8
  }

  // Info del proyecto
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)

  if (projectData.clientName) {
    doc.text(`Cliente: ${projectData.clientName}`, 20, yPos)
    yPos += 6
  }
  if (projectData.contractorName) {
    doc.text(`Contratista: ${projectData.contractorName}`, 20, yPos)
    yPos += 6
  }
  if (projectData.address) {
    doc.text(`Dirección: ${projectData.address}`, 20, yPos)
    yPos += 6
  }
  doc.text(`Fecha de creación: ${new Date(projectData.createdAt).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric'
  })}`, 20, yPos)
  yPos += 16

  // ── Evidencias fotográficas ───────────────────────────────────────────────
  if (evidences.length > 0) {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Evidencias Fotográficas', 20, yPos)
    yPos += 10

    for (const ev of evidences) {
      if (yPos > 240) {
        doc.addPage()
        await drawHeader(doc, projectName, companyName, projectData.contractorLogo)
        yPos = 55
      }

      try {
        const imgData = await loadImageAsBase64(ev.image_url)
        doc.addImage(imgData, 'JPEG', 20, yPos, 80, 60)

        if (ev.caption) {
          doc.setFontSize(9)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(100, 100, 100)
          const captionLines = doc.splitTextToSize(ev.caption, 80)
          doc.text(captionLines, 20, yPos + 65)
        }

        yPos += 80
      } catch {
        doc.setFontSize(9)
        doc.setTextColor(200, 0, 0)
        doc.text('Error al cargar imagen', 20, yPos)
        yPos += 10
      }
    }
  }

  // ── Documentos externos ───────────────────────────────────────────────────
  if (links.length > 0) {
    if (yPos > 220) {
      doc.addPage()
      await drawHeader(doc, projectName, companyName, projectData.contractorLogo)
      yPos = 55
    } else {
      yPos += 6
    }

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Documentos Externos', 20, yPos)
    yPos += 10

    const pageWidth = doc.internal.pageSize.getWidth()

    links.forEach((link, idx) => {
      if (yPos > 265) {
        doc.addPage()
        drawHeader(doc, projectName, companyName, projectData.contractorLogo)
        yPos = 55
      }

      // Nombre del archivo
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(40, 40, 40)
      doc.text(`${idx + 1}. ${link.link_title}`, 20, yPos)
      yPos += 6

      // URL clicable
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(37, 99, 235)
      const urlLines = doc.splitTextToSize(link.link_url, pageWidth - 44)
      doc.textWithLink(urlLines[0], 25, yPos, { url: link.link_url })
      if (urlLines.length > 1) {
        yPos += 5
        doc.text(urlLines.slice(1), 25, yPos)
        yPos += (urlLines.length - 1) * 5
      }
      yPos += 6

      // Descripción opcional
      if (link.description) {
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        const descLines = doc.splitTextToSize(link.description, pageWidth - 44)
        doc.text(descLines, 25, yPos)
        yPos += descLines.length * 5 + 2
      }

      yPos += 3
    })
  }

  // ── Página de firmas ──────────────────────────────────────────────────────
  doc.addPage()
  await drawHeader(doc, projectName, companyName, projectData.contractorLogo)
  yPos = 70

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Firmas de Conformidad', 105, yPos, { align: 'center' })
  yPos += 40

  doc.setDrawColor(150, 150, 150)
  doc.setLineWidth(0.5)

  // Firma contratista
  doc.rect(20, yPos, 70, 40, 'S')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(60, 60, 60)
  doc.text('Contratista', 55, yPos + 50, { align: 'center' })
  if (projectData.contractorName) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(projectData.contractorName, 55, yPos + 56, { align: 'center' })
  }

  // Firma cliente
  doc.rect(110, yPos, 70, 40, 'S')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(60, 60, 60)
  doc.text('Cliente', 145, yPos + 50, { align: 'center' })
  if (projectData.clientName) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(projectData.clientName, 145, yPos + 56, { align: 'center' })
  }

  // Descargar
  const fileName = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${stageName.replace(/[^a-z0-9]/gi, '_')}.pdf`
  doc.save(fileName)
}

// Generar PDF global del proyecto
export async function generateProjectPDF(
  projectData: ProjectData,
  stages: Stage[],
  allEvidences: Record<string, Evidence[]>
) {
  const doc = new jsPDF()
  const companyName = projectData.contractorCompany || projectData.contractorName || 'Empresa Contratista'
  const projectName = projectData.name || 'Proyecto Sin Nombre'
  
  // Portada
  doc.setFillColor(79, 70, 229)
  doc.rect(0, 0, 210, 297, 'F')
  
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(projectName, 105, 120, { align: 'center' })
  
  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  doc.text('Reporte de Proyecto', 105, 135, { align: 'center' })
  
  doc.setFontSize(12)
  doc.text(new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), 105, 150, { align: 'center' })
  
  doc.setFontSize(11)
  doc.text(companyName, 105, 165, { align: 'center' })

  // Página de información
  doc.addPage()
  await drawHeader(doc, projectName, companyName, projectData.contractorLogo)
  let yPos = 60

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Información del Proyecto', 20, yPos)
  yPos += 15

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  
  if (projectData.description) {
    doc.setFont('helvetica', 'bold')
    doc.text('Descripción:', 20, yPos)
    yPos += 6
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const descLines = doc.splitTextToSize(projectData.description, 170)
    doc.text(descLines, 20, yPos)
    yPos += descLines.length * 6 + 10
  }

  if (projectData.clientName) {
    doc.setFontSize(11)
    doc.text(`Cliente: ${projectData.clientName}`, 20, yPos)
    yPos += 8
  }

  if (projectData.contractorName) {
    doc.text(`Contratista: ${projectData.contractorName}`, 20, yPos)
    yPos += 8
  }

  if (projectData.address) {
    doc.text(`Dirección: ${projectData.address}`, 20, yPos)
    yPos += 8
  }

  doc.text(`Fecha de creación: ${new Date(projectData.createdAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, 20, yPos)
  yPos += 15

  // Resumen de etapas
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Resumen de Etapas', 20, yPos)
  yPos += 10

  stages.forEach((stage, idx) => {
    if (yPos > 260) {
      doc.addPage()
      drawHeader(doc, projectName, companyName, projectData.contractorLogo)
      yPos = 60
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(`${idx + 1}. ${stage.name}`, 20, yPos)
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Estado: ${getStatusLabel(stage.status)}`, 30, yPos + 5)
    
    const evCount = allEvidences[stage.id]?.length ?? 0
    doc.text(`Evidencias: ${evCount}`, 30, yPos + 10)
    
    yPos += 18
  })

  // Detalle de cada etapa con evidencias
  for (const stage of stages) {
    doc.addPage()
    await drawHeader(doc, projectName, companyName, projectData.contractorLogo)
    yPos = 60

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(79, 70, 229)
    doc.text(stage.name || 'Sin nombre', 20, yPos)
    yPos += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Estado: ${getStatusLabel(stage.status)}`, 20, yPos)
    yPos += 10

    if (stage.description) {
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      const lines = doc.splitTextToSize(stage.description, 170)
      doc.text(lines, 20, yPos)
      yPos += lines.length * 6 + 10
    }

    const evidences = allEvidences[stage.id] ?? []
    
    if (evidences.length > 0) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Evidencias:', 20, yPos)
      yPos += 10

      for (const ev of evidences) {
        if (yPos > 240) {
          doc.addPage()
          await drawHeader(doc, projectName, companyName, projectData.contractorLogo)
          yPos = 60
        }

        try {
          const imgData = await loadImageAsBase64(ev.image_url)
          doc.addImage(imgData, 'JPEG', 20, yPos, 80, 60)
          
          if (ev.caption) {
            doc.setFontSize(9)
            doc.setFont('helvetica', 'italic')
            doc.setTextColor(100, 100, 100)
            const captionLines = doc.splitTextToSize(ev.caption, 80)
            doc.text(captionLines, 20, yPos + 65)
          }
          
          yPos += 80
        } catch (error) {
          console.error('Error cargando imagen:', error)
        }
      }
    }
  }

  // Página de firmas
  doc.addPage()
  await drawHeader(doc, projectName, companyName, projectData.contractorLogo)
  yPos = 70
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Firmas de Conformidad', 105, yPos, { align: 'center' })
  yPos += 40

  // Cuadros para firmas
  doc.setDrawColor(150, 150, 150)
  doc.setLineWidth(0.5)

  doc.rect(20, yPos, 70, 40, 'S')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(60, 60, 60)
  doc.text('Contratista', 55, yPos + 50, { align: 'center' })
  if (projectData.contractorName) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(projectData.contractorName, 55, yPos + 56, { align: 'center' })
  }

  doc.rect(110, yPos, 70, 40, 'S')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(60, 60, 60)
  doc.text('Cliente', 145, yPos + 50, { align: 'center' })
  if (projectData.clientName) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(projectData.clientName, 145, yPos + 56, { align: 'center' })
  }

  const fileName = `${projectName.replace(/[^a-z0-9]/gi, '_')}_completo.pdf`
  doc.save(fileName)
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    progress: 'En Progreso',
    completed: 'Completada',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  }
  return labels[status] ?? status
}