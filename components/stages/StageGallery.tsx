'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

interface StageGalleryProps {
  stageId: string
  projectId: string
  evidences: any[]
  canEdit: boolean
}

export default function StageGallery({ stageId, projectId, evidences, canEdit }: StageGalleryProps) {
  const [images, setImages] = useState(evidences)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const supabase = createClientComponentClient<Database>()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    setUploading(true)
    const files = Array.from(e.target.files)

    for (const file of files) {
      try {
        // Comprimir imagen si es muy grande
        const compressedFile = await compressImage(file)
        
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${projectId}/${stageId}/${fileName}`

        // Subir a Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('evidences')
          .upload(filePath, compressedFile)

        if (uploadError) throw uploadError

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('evidences')
          .getPublicUrl(filePath)

        // Guardar en base de datos
        const { data: { user } } = await supabase.auth.getUser()

        const { data: newEvidence, error: dbError } = await (supabase as any)
          .from('evidences')
          .insert({
            stage_id: stageId,
            image_url: publicUrl,
            image_path: filePath,
            uploaded_by: user?.id,
          })
          .select()
          .single()

        if (dbError) throw dbError

        // Agregar a la lista local
        setImages(prev => [newEvidence, ...prev])
      } catch (error) {
        console.error('Error al subir imagen:', error)
        alert('Error al subir la imagen')
      }
    }

    setUploading(false)
    e.target.value = '' // Reset input
  }

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = document.createElement('img')
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 1920
          const MAX_HEIGHT = 1920
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
            } else {
              resolve(file)
            }
          }, 'image/jpeg', 0.85)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDelete = async (evidence: any) => {
    if (!confirm('¿Eliminar esta foto?')) return

    try {
      // Eliminar de Storage
      const { error: storageError } = await supabase.storage
        .from('evidences')
        .remove([evidence.image_path])

      if (storageError) throw storageError

      // Eliminar de base de datos
      const { error: dbError } = await (supabase as any)
        .from('evidences')
        .delete()
        .eq('id', evidence.id)

      if (dbError) throw dbError

      // Actualizar lista local
      setImages(prev => prev.filter(img => img.id !== evidence.id))
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('Error al eliminar la imagen')
    }
  }

  if (images.length === 0 && !canEdit) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-2 text-sm text-gray-600">No hay evidencias fotográficas</p>
      </div>
    )
  }

  return (
    <div>
      {/* Botón de subir (solo si puede editar) */}
      {canEdit && (
        <div className="mb-6">
          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {uploading ? 'Subiendo...' : 'Subir Fotos'}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Grid de imágenes */}
      {images.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-600">Aún no hay fotos subidas</p>
          <p className="text-xs text-gray-500 mt-1">Sube la primera foto para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((evidence) => (
            <div
              key={evidence.id}
              className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-100 border border-gray-200 hover:border-blue-500 transition-all"
              onClick={() => setSelectedImage(evidence.image_url)}
            >
              <Image
                src={evidence.image_url}
                alt="Evidencia"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(evidence)
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal para ver imagen en grande */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="Vista ampliada"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}