'use client'

import { useState } from 'react'
import AddExternalLinkForm from './AddExternalLinkForm'

interface AddExternalLinkButtonProps {
  stageId: string
}

export default function AddExternalLinkButton({ stageId }: AddExternalLinkButtonProps) {
  const [showForm, setShowForm] = useState(false)

  const handleSuccess = () => {
    setShowForm(false)
    // Refresh de la página para mostrar el nuevo link
    window.location.reload()
  }

  if (showForm) {
    return (
      <div className="mt-4">
        <AddExternalLinkForm
          stageId={stageId}
          onSuccess={handleSuccess}
          onCancel={() => setShowForm(false)}
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Agregar Link
    </button>
  )
}