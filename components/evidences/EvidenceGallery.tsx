'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import ImageViewer from './ImageViewer'
import { Trash2, ImageOff } from 'lucide-react'

type Evidence = {
  id: string
  image_url: string
  image_path: string
  caption: string | null
  uploaded_by: string
}

interface EvidenceGalleryProps {
  evidences: Evidence[]
  userId: string
  userRole: string
  onDeleted?: (id: string) => void
}

export default function EvidenceGallery({ evidences, userId, userRole, onDeleted }: EvidenceGalleryProps) {
  const supabase = createClient()
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const canDelete = (ev: Evidence) =>
    userRole === 'god' || ev.uploaded_by === userId

  const handleDelete = async (ev: Evidence, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar esta evidencia?')) return

    setDeletingId(ev.id)
    try {
      // Eliminar del storage
      await supabase.storage.from('evidences').remove([ev.image_path])
      // Eliminar de la DB
      await (supabase.from('evidences') as any).delete().eq('id', ev.id)
      onDeleted?.(ev.id)
    } finally {
      setDeletingId(null)
    }
  }

  if (evidences.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-300">
        <ImageOff size={32} className="mb-2" />
        <p className="text-sm">Sin evidencias</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {evidences.map((ev, idx) => (
          <div
            key={ev.id}
            className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-100"
            onClick={() => setViewerIndex(idx)}
          >
            <img
              src={ev.image_url}
              alt={ev.caption ?? 'Evidencia'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

            {/* Delete button */}
            {canDelete(ev) && (
              <button
                onClick={(e) => handleDelete(ev, e)}
                disabled={deletingId === ev.id}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <Trash2 size={12} />
              </button>
            )}

            {/* Caption indicator */}
            {ev.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {ev.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {viewerIndex !== null && (
        <ImageViewer
          evidences={evidences}
          currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </>
  )
}
