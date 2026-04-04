'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { X } from 'lucide-react'

interface StageFormModalProps {
  projectId: string
  nextOrder: number
  onClose: () => void
  onCreated: (stage: any) => void
}

export default function StageFormModal({
  projectId,
  nextOrder,
  onClose,
  onCreated,
}: StageFormModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('stages')
        .insert({
          project_id: projectId,
          name: form.name,
          description: form.description || null,
          order_index: nextOrder,
          status: 'pending',
        } as any)
        .select()
        .single() as { data: any; error: any }

      if (error) throw error
      onCreated(data)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Nueva Etapa</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre de la Etapa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="input"
              required
              placeholder="Ej: Cimentación, Estructura, Acabados..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="input resize-none"
              rows={3}
              placeholder="Descripción de trabajos a realizar..."
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">
              {nextOrder + 1}
            </span>
            <span>Esta será la etapa #{nextOrder + 1}</span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Etapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
