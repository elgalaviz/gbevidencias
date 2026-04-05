'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Upload, X, ImagePlus } from 'lucide-react'

type Evidence = {
  id: string
  image_url: string
  image_path: string
  caption: string | null
  uploaded_by: string
}

interface EvidenceUploadProps {
  stageId: string
  projectId: string
  userId: string
  onUploaded: (evidences: Evidence[]) => void
}

type FilePreview = {
  file: File
  preview: string
  caption: string
  uploading: boolean
  error: string | null
}

// Función para comprimir imágenes usando Canvas
async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Redimensionar si es muy grande
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo crear contexto canvas'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al comprimir imagen'))
              return
            }
            
            // Crear nuevo archivo con el blob comprimido
            const compressedFile = new File(
              [blob], 
              file.name, 
              { type: 'image/jpeg', lastModified: Date.now() }
            )
            
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Error al cargar imagen'))
    }
    
    reader.onerror = () => reject(new Error('Error al leer archivo'))
  })
}

export default function EvidenceUpload({ stageId, projectId, userId, onUploaded }: EvidenceUploadProps) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FilePreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const addFiles = (selected: FileList | null) => {
    if (!selected) return
    const newFiles: FilePreview[] = Array.from(selected)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        caption: '',
        uploading: false,
        error: null,
      }))
    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const setCaption = (idx: number, caption: string) => {
    setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, caption } : f)))
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)

    const uploaded: Evidence[] = []

    for (let i = 0; i < files.length; i++) {
      const { file, caption } = files[i]
      const ext = 'jpg' // Siempre guardamos como JPG después de comprimir
      const path = `${projectId}/${stageId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, uploading: true, error: null } : f)))

      try {
        // Comprimir imagen antes de subir
        const compressedFile = await compressImage(file, 1920, 0.8)
        
        console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)}MB → Comprimida: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)

        // Upload to storage
        const { error: storageError } = await supabase.storage
          .from('evidences')
          .upload(path, compressedFile, { upsert: false })

        if (storageError) throw storageError

        // Get public URL
        const { data: urlData } = supabase.storage.from('evidences').getPublicUrl(path)

        // Save to DB
        const { data: evData, error: dbError } = await (supabase.from('evidences') as any)
          .insert({
            stage_id: stageId,
            image_url: urlData.publicUrl,
            image_path: path,
            caption: caption.trim() || null,
            uploaded_by: userId,
          })
          .select()
          .single()

        if (dbError) throw dbError

        uploaded.push(evData)
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, uploading: false } : f)))
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, uploading: false, error: err.message } : f))
        )
      }
    }

    if (uploaded.length > 0) {
      onUploaded(uploaded)
      setFiles([])
    }

    setUploading(false)
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          addFiles(e.dataTransfer.files)
        }}
      >
        <ImagePlus size={28} className="text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          <span className="text-primary-500 font-medium">Selecciona fotos</span> o arrastra aquí
        </p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP • Se optimizarán automáticamente</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fp, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <img
                src={fp.preview}
                alt=""
                className="w-16 h-16 object-cover rounded-lg shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate mb-1">{fp.file.name}</p>
                <input
                  type="text"
                  value={fp.caption}
                  onChange={(e) => setCaption(idx, e.target.value)}
                  placeholder="Descripción (opcional)"
                  className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
                  disabled={fp.uploading}
                />
                {fp.error && (
                  <p className="text-red-500 text-xs mt-1">{fp.error}</p>
                )}
                {fp.uploading && (
                  <p className="text-primary-500 text-xs mt-1 animate-pulse">Optimizando y subiendo...</p>
                )}
              </div>
              {!fp.uploading && (
                <button
                  onClick={() => removeFile(idx)}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            {uploading ? 'Subiendo...' : `Subir ${files.length} foto${files.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}