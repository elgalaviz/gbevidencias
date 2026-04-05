'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const roles = [
  { value: 'cliente', label: '🏢 Cliente', desc: 'Aprueba y revisa etapas de sus proyectos' },
  { value: 'contratista', label: '👷 Contratista', desc: 'Gestiona proyectos y sube evidencias' },
  { value: 'ayudante', label: '🔧 Ayudante', desc: 'Sube evidencias fotográficas' },
]

interface UserFormProps {
  allowedRoles: string[]
  currentUserId: string
}

export default function UserForm({ allowedRoles, currentUserId }: UserFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: allowedRoles[0] || 'cliente',
    phone: '',
    company_name: '',
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredRoles = roles.filter(r => allowedRoles.includes(r.value))

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('El logo no debe superar 5MB')
      return
    }

    setLogoFile(file)
    setError('')

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadLogo = async (userId: string): Promise<string | null> => {
    if (!logoFile) return null

    try {
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { data, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(data.path)

      return publicUrl
    } catch (err) {
      console.error('Error uploading logo:', err)
      throw new Error('Error al subir el logo')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validaciones
      if (!formData.email || !formData.password || !formData.full_name) {
        throw new Error('Por favor completa todos los campos obligatorios')
      }

      if (formData.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres')
      }

      if (formData.role === 'contratista' && !formData.company_name) {
        throw new Error('El nombre de empresa es obligatorio para contratistas')
      }

      // Crear usuario
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          created_by: currentUserId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear usuario')
      }

      // Si es contratista y hay logo, subirlo
      let logoUrl = null
      if (formData.role === 'contratista' && logoFile && result.userId) {
        logoUrl = await uploadLogo(result.userId)

        // Actualizar el perfil con el logo URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ logo_url: logoUrl })
          .eq('id', result.userId)

        if (updateError) {
          console.error('Error updating logo URL:', updateError)
          // No lanzamos error aquí, el usuario ya está creado
        }
      }

      router.push('/dashboard/users')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isContractor = formData.role === 'contratista'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Selector de Rol */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rol del Usuario *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {filteredRoles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => setFormData({ ...formData, role: role.value })}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                formData.role === role.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900">{role.label}</div>
              <div className="text-sm text-gray-600 mt-1">{role.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Datos Personales */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <h3 className="font-semibold text-gray-900 mb-4">Datos Personales</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo *
          </label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Juan Pérez García"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="usuario@ejemplo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña *
          </label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Mínimo 8 caracteres"
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="(81) 1234-5678"
          />
        </div>
      </div>

      {/* Datos de Empresa (solo para contratistas) */}
      {isContractor && (
        <div className="bg-blue-50 p-6 rounded-lg space-y-4 border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Datos de Empresa</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de Empresa *
            </label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Constructora ejemplo S.A. de C.V."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de Empresa
            </label>
            
            {!logoPreview ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click para subir logo</span>
                  <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (máx. 5MB)</span>
                </label>
              </div>
            ) : (
              <div className="relative">
                <div className="w-full h-40 border-2 border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Este logo aparecerá en los PDFs generados
            </p>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando...' : 'Crear Usuario'}
        </button>
      </div>
    </form>
  )
}