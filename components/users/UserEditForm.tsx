'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

const roles = [
  { value: 'god', label: '⚡ GOD', desc: 'Acceso total al sistema' },
  { value: 'cliente', label: '🏢 Cliente', desc: 'Aprueba y revisa etapas de sus proyectos' },
  { value: 'contratista', label: '👷 Contratista', desc: 'Gestiona proyectos y sube evidencias' },
  { value: 'ayudante', label: '🔧 Ayudante', desc: 'Sube evidencias fotográficas' },
]

interface UserEditFormProps {
  user: Profile
  allowedRoles: string[]
  currentUserId: string
  canChangeRole: boolean
}

export default function UserEditForm({ user, allowedRoles, currentUserId, canChangeRole }: UserEditFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    role: user.role || 'cliente',
    phone: user.phone || '',
    company_name: user.company_name || '',
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(user.logo_url)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const filteredRoles = roles.filter(r => allowedRoles.includes(r.value))

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('El logo no debe superar 5MB')
      return
    }

    setLogoFile(file)
    setError('')

    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La foto no debe superar 5MB')
      return
    }

    setAvatarFile(file)
    setError('')

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = async () => {
    if (user.logo_url) {
      try {
        const path = user.logo_url.split('/logos/')[1]
        if (path) {
          await supabase.storage.from('logos').remove([path])
        }
      } catch (err) {
        console.error('Error removing old logo:', err)
      }
    }
    
    setLogoFile(null)
    setLogoPreview(null)
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  const removeAvatar = async () => {
    if (user.avatar_url) {
      try {
        const path = user.avatar_url.split('/avatars/')[1]
        if (path) {
          await supabase.storage.from('avatars').remove([path])
        }
      } catch (err) {
        console.error('Error removing old avatar:', err)
      }
    }
    
    setAvatarFile(null)
    setAvatarPreview(null)
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
  }

  const uploadFile = async (file: File, bucket: string, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      return publicUrl
    } catch (err) {
      console.error(`Error uploading to ${bucket}:`, err)
      throw new Error(`Error al subir el archivo`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      if (!formData.full_name) {
        throw new Error('El nombre completo es obligatorio')
      }

      if (formData.role === 'contratista' && !formData.company_name) {
        throw new Error('El nombre de empresa es obligatorio para contratistas')
      }

      const updateData: ProfileUpdate = {
        full_name: formData.full_name,
        role: formData.role as any,
        phone: formData.phone || null,
        company_name: formData.role === 'contratista' ? formData.company_name : null,
      }

      // Si cambió el logo
      if (logoFile) {
        if (user.logo_url) {
          try {
            const path = user.logo_url.split('/logos/')[1]
            if (path) {
              await supabase.storage.from('logos').remove([path])
            }
          } catch (err) {
            console.error('Error removing old logo:', err)
          }
        }
        
        const logoUrl = await uploadFile(logoFile, 'logos', user.id)
        updateData.logo_url = logoUrl
      } else if (!logoPreview && user.logo_url) {
        updateData.logo_url = null
      }

      // Si cambió el avatar
      if (avatarFile) {
        if (user.avatar_url) {
          try {
            const path = user.avatar_url.split('/avatars/')[1]
            if (path) {
              await supabase.storage.from('avatars').remove([path])
            }
          } catch (err) {
            console.error('Error removing old avatar:', err)
          }
        }
        
        const avatarUrl = await uploadFile(avatarFile, 'avatars', user.id)
        updateData.avatar_url = avatarUrl
      } else if (!avatarPreview && user.avatar_url) {
        updateData.avatar_url = null
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('profiles') as any)
        .update(updateData)
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess(true)
      
      setTimeout(() => {
        router.push('/dashboard/users')
        router.refresh()
      }, 1000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isContractor = formData.role === 'contratista'
  const isHelper = formData.role === 'ayudante'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✅ Usuario actualizado correctamente. Redirigiendo...
        </div>
      )}

      {canChangeRole && filteredRoles.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rol del Usuario
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredRoles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setFormData({ ...formData, role: role.value as any })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  formData.role === role.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">{role.label}</div>
                <div className="text-xs text-gray-600 mt-1">{role.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!canChangeRole && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol Actual
          </label>
          <div className="font-semibold text-gray-900">
            {roles.find(r => r.value === formData.role)?.label}
          </div>
        </div>
      )}

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
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            disabled
            value={user.email}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">El email no se puede modificar</p>
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
                  ref={logoInputRef}
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
          </div>
        </div>
      )}

      {isHelper && (
        <div className="bg-green-50 p-6 rounded-lg space-y-4 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Foto del Ayudante</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto (Opcional)
            </label>
            
            {!avatarPreview ? (
              <div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click para subir foto</span>
                  <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (máx. 5MB)</span>
                </label>
              </div>
            ) : (
              <div className="relative">
                <div className="w-full h-40 border-2 border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
          disabled={loading || success}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : success ? '✓ Guardado' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}