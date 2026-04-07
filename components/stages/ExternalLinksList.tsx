'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

interface ExternalLinksListProps {
  stageId: string
  canEdit?: boolean
}

type StageLink = Database['public']['Tables']['stage_links']['Row']

export default function ExternalLinksList({ stageId, canEdit = false }: ExternalLinksListProps) {
  const [links, setLinks] = useState<StageLink[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    fetchLinks()
  }, [stageId])

  const fetchLinks = async () => {
    setLoading(true)
    const { data } = await (supabase as any)
      .from('stage_links')
      .select('*')
      .eq('stage_id', stageId)
      .order('created_at', { ascending: false })

    if (data) setLinks(data)
    setLoading(false)
  }

  const handleDelete = async (linkId: string) => {
    if (!confirm('¿Eliminar este link?')) return

    const { error } = await (supabase as any)
      .from('stage_links')
      .delete()
      .eq('id', linkId)

    if (!error) {
      fetchLinks()
    }
  }

  const getIcon = (type: string | null) => {
    switch (type) {
      case 'google_drive':
        return '📁'
      case 'dropbox':
        return '📦'
      case 'onedrive':
        return '☁️'
      default:
        return '🔗'
    }
  }

  const getLinkDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    } catch {
      return 'Link externo'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          No hay links externos agregados
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Agrega links a Drive, Dropbox u otros servicios
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div
          key={link.id}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{getIcon(link.link_type)}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900">{link.link_title}</h3>
              {link.description && (
                <p className="text-sm text-gray-600 mt-1">{link.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1 truncate">
                {getLinkDomain(link.link_url)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <a
              href={link.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Abrir
            </a>
            {canEdit && (
              <button
                onClick={() => handleDelete(link.id)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}