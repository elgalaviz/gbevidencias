'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ProfileOption = { id: string; full_name: string; email: string }

interface ProjectFormProps {
  clients: ProfileOption[]
  contractors: ProfileOption[]
  userId: string
}

export default function ProjectForm({ clients, contractors, userId }: ProjectFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    client_id: '',
    contractor_id: '',
    status: 'active',
  })

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const insertData: Database['public']['Tables']['projects']['Insert'] = {
        name: form.name,
        description: form.description || null,
        address: form.address || null,
        client_id: form.client_id,
        contractor_id: form.contractor_id || null,
        status: form.status as Database['public']['Tables']['projects']['Row']['status'],
        created_by: userId,
      }

      const { data, error } = await supabase
        .from('projects')
        .insert(insertData as any)
        .select('id')
        .single() as { data: { id: string } | null; error: any }

      if (error) throw error
      if (!data) throw new Error('No se pudo crear el proyecto')

      router.push(`/dashboard/projects/${data.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Nombre del Proyecto <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="input"
          required
          placeholder="Ej: Remodelación Casa Pérez"
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className="input resize-none"
          rows={3}
          placeholder="Descripción detallada del proyecto..."
        />
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          className="input"
          placeholder="Ej: Calle 123 #45-67, Ciudad"
        />
      </div>

      {/* Cliente y Contratista */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Cliente <span className="text-red-500">*</span>
          </label>
          <select
            value={form.client_id}
            onChange={(e) => set('client_id', e.target.value)}
            className="input"
            required
          >
            <option value="">Seleccionar cliente...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} — {c.email}
              </option>
            ))}
          </select>
          {clients.length === 0 && (
            <p className="text-yellow-600 text-xs mt-1">
              No hay clientes. Crea usuarios con rol "cliente" primero.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Contratista <span className="text-gray-400 text-xs">(opcional)</span>
          </label>
          <select
            value={form.contractor_id}
            onChange={(e) => set('contractor_id', e.target.value)}
            className="input"
          >
            <option value="">Sin contratista</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} — {c.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estado */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Estado inicial</label>
        <div className="flex gap-3 flex-wrap">
          {[
            { value: 'active', label: 'Activo' },
            { value: 'pending', label: 'Pendiente' },
            { value: 'paused', label: 'Pausado' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium ${
                form.status === opt.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="status"
                value={opt.value}
                checked={form.status === opt.value}
                onChange={(e) => set('status', e.target.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-secondary flex-1"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary flex-1 py-3"
          disabled={loading}
        >
          {loading ? 'Creando...' : 'Crear Proyecto'}
        </button>
      </div>
    </form>
  )
}
