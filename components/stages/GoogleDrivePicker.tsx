'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    gapi: any
    google: any
  }
}

interface GoogleDrivePickerProps {
  onFilePicked: (fileName: string, fileUrl: string, fileType: 'folder' | 'file') => void
  onCancel: () => void
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? ''

// Carga un script externo una sola vez
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`No se pudo cargar: ${src}`))
    document.head.appendChild(script)
  })
}

export default function GoogleDrivePicker({ onFilePicked, onCancel }: GoogleDrivePickerProps) {
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [error, setError] = useState('')
  const tokenClientRef = useRef<any>(null)
  const accessTokenRef = useRef<string>('')

  useEffect(() => {
    if (!CLIENT_ID || !API_KEY) {
      setError('Variables de entorno de Google no configuradas.')
      setLoadState('error')
      return
    }

    setLoadState('loading')

    Promise.all([
      loadScript('https://apis.google.com/js/api.js'),
      loadScript('https://accounts.google.com/gsi/client'),
    ])
      .then(() => {
        window.gapi.load('picker', {
          callback: () => setLoadState('ready'),
          onerror: () => {
            setError('Error al cargar Google Picker.')
            setLoadState('error')
          },
        })
      })
      .catch((err) => {
        setError(err.message)
        setLoadState('error')
      })
  }, [])

  // Abre el Picker nativo de Google Drive
  function openPicker(token: string) {
    const { google } = window

    const docsView = new google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)

    const picker = new google.picker.PickerBuilder()
      .setAppId(CLIENT_ID.split('-')[0])
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .setLocale('es')
      .setTitle('Seleccionar archivo o carpeta')
      .addView(docsView)
      .addView(new google.picker.DocsView(google.picker.ViewId.FOLDERS)
        .setSelectFolderEnabled(true))
      .setCallback((data: any) => {
        if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
          const doc = data[google.picker.Response.DOCUMENTS][0]
          const id: string = doc[google.picker.Document.ID]
          const name: string = doc[google.picker.Document.NAME]
          const mimeType: string = doc[google.picker.Document.MIME_TYPE]

          const isFolder = mimeType === 'application/vnd.google-apps.folder'
          const fileUrl = isFolder
            ? `https://drive.google.com/drive/folders/${id}`
            : `https://drive.google.com/file/d/${id}/view`

          onFilePicked(name, fileUrl, isFolder ? 'folder' : 'file')
        } else if (data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
          onCancel()
        }
      })
      .build()

    picker.setVisible(true)
  }

  function handleOpenPicker() {
    if (loadState !== 'ready') return

    // Reutilizar token si ya existe
    if (accessTokenRef.current) {
      openPicker(accessTokenRef.current)
      return
    }

    // Inicializar cliente OAuth2
    if (!tokenClientRef.current) {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            setError('Error de autorización de Google.')
            return
          }
          accessTokenRef.current = response.access_token
          openPicker(response.access_token)
        },
      })
    }

    tokenClientRef.current.requestAccessToken({ prompt: '' })
  }

  if (loadState === 'error') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <button
        onClick={handleOpenPicker}
        disabled={loadState !== 'ready'}
        className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadState === 'loading' ? (
          <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          // Logo oficial de Google Drive
          <svg viewBox="0 0 87.3 78" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5A9.06 9.06 0 000 53h27.5z" fill="#00ac47"/>
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.9 11.5z" fill="#ea4335"/>
            <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
            <path d="M73.4 26.5L60.7 4.5C59.9 3.1 58.75 2 57.4 1.2L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
        )}
        <span className="text-gray-700 font-medium">
          {loadState === 'loading' ? 'Cargando Google Drive...' : 'Abrir Google Drive'}
        </span>
      </button>

      <button
        onClick={onCancel}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Cancelar
      </button>
    </div>
  )
}
