'use client'

import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

type Evidence = {
  id: string
  image_url: string
  caption: string | null
}

interface ImageViewerProps {
  evidences: Evidence[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export default function ImageViewer({ evidences, currentIndex, onClose, onNavigate }: ImageViewerProps) {
  const current = evidences[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < evidences.length - 1

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentIndex, hasPrev, hasNext, onClose, onNavigate])

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/30 rounded-full p-2 transition-colors"
      >
        <X size={24} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {currentIndex + 1} / {evidences.length}
      </div>

      {/* Prev */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1) }}
          className="absolute left-4 text-white/70 hover:text-white bg-black/30 rounded-full p-3 transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Image */}
      <div className="max-w-5xl max-h-[85vh] mx-16 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img
          src={current.image_url}
          alt={current.caption ?? 'Evidencia'}
          className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
        />
        {current.caption && (
          <p className="text-white/80 text-sm mt-3 text-center max-w-md">{current.caption}</p>
        )}
      </div>

      {/* Next */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1) }}
          className="absolute right-4 text-white/70 hover:text-white bg-black/30 rounded-full p-3 transition-colors"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Thumbnails strip */}
      {evidences.length > 1 && (
        <div className="absolute bottom-4 flex gap-2 overflow-x-auto max-w-full px-4">
          {evidences.map((ev, i) => (
            <button
              key={ev.id}
              onClick={(e) => { e.stopPropagation(); onNavigate(i) }}
              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === currentIndex ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={ev.image_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
