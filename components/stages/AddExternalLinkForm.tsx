'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'
import GoogleDrivePicker from './GoogleDrivePicker'

interface AddExternalLinkFormProps {
  stageId: string
  onSuccess: () => void
  onCancel: () => void
}

type Mode = 'choice' | 'manual' | 'picker'

export default function AddExternalLinkForm({ stageId, onSuccess, onCancel }: AddExternalLinkFormProps) {
  const [mode, setMode] = useState<Mode>('choice')

  // Campos del formulario manual
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [linkType, setLinkType] = useState('google_drive')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClientComponentClient<Database>()

  // Guardado compartido en Supabase
  async function saveLink(params: {
    title: string
    url: string
    linkType: string
    description: string | null
  }) {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error: insertError } = await (supabase as any)
      .from('stage_links')
      .insert({
        stage_id: stageId,
        link_title: params.title,
        link_url: params.url,
        link_type: params.linkType,
        description: params.description,
        created_by: user?.id ?? null,
      })

    setLoading(false)

    if (insertError) {
      console.error('Error guardando link:', insertError)
      setError('Error al guardar el link. Intenta de nuevo.')
      return false
    }

    return true
  }

  // Callback del Google Drive Picker
  async function handleFilePicked(fileName: string, fileUrl: string, fileType: 'folder' | 'file') {
    const ok = await saveLink({
      title: fileName,
      url: fileUrl,
      linkType: fileType === 'folder' ? 'google_drive_folder' : 'google_drive',
      description: null,
    })
    if (ok) onSuccess()
  }

  // Submit del formulario manual
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      new URL(url)
    } catch {
      setError('URL inválida')
      return
    }

    const ok = await saveLink({ title, url, linkType, description: description || null })
    if (ok) {
      setTitle('')
      setUrl('')
      setDescription('')
      onSuccess()
    }
  }

  // ── Vista: elección de método ─────────────────────────────────────────────
  if (mode === 'choice') {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">Agregar Link Externo</h3>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-5">¿Cómo quieres agregar el archivo?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Opción Google Drive Picker */}
          <button
            onClick={() => setMode('picker')}
            className="flex flex-col items-center gap-3 p-5 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <svg viewBox="0 0 87.3 78" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5A9.06 9.06 0 000 53h27.5z" fill="#00ac47"/>
              <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.9 11.5z" fill="#ea4335"/>
              <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="M73.4 26.5L60.7 4.5C59.9 3.1 58.75 2 57.4 1.2L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            <div className="text-center">
              <p className="font-medium text-gray-800 group-hover:text-blue-700">Seleccionar de Google Drive</p>
              <p className="text-xs text-gray-400 mt-0.5">Abre el selector nativo</p>
            </div>
          </button>

          {/* Opción Manual */}
          <button
            onClick={() => setMode('manual')}
            className="flex flex-col items-center gap-3 p-5 border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
          >
            <svg className="w-10 h-10 text-gray-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <div className="text-center">
              <p className="font-medium text-gray-800 group-hover:text-indigo-700">Pegar link manualmente</p>
              <p className="text-xs text-gray-400 mt-0.5">Dropbox, OneDrive, u otro</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ── Vista: Google Drive Picker ────────────────────────────────────────────
  if (mode === 'picker') {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Seleccionar de Google Drive</h3>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <svg className="w-8 h-8 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-sm text-gray-500">Guardando en Avanzzo...</p>
          </div>
        ) : (
          <GoogleDrivePicker
            onFilePicked={handleFilePicked}
            onCancel={() => setMode('choice')}
          />
        )}
      </div>
    )
  }

  // ── Vista: formulario manual ──────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('choice')}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-gray-900">Pegar link manualmente</h3>
        </div>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Carpeta de Planos"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de almacenamiento *</label>
        <select
          value={linkType}
          onChange={(e) => setLinkType(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="google_drive">📁 Google Drive</option>
          <option value="dropbox">📦 Dropbox</option>
          <option value="onedrive">☁️ OneDrive</option>
          <option value="other">🔗 Otro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">URL del link *</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Copia y pega el link del archivo compartido</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción (opcional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción breve del contenido..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Link'}
        </button>
      </div>
    </form>
  )
}
