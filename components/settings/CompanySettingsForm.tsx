'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Save, Building2, Phone, Globe, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface CompanySettingsFormProps {
  profile: any
}

export default function CompanySettingsForm({ profile }: CompanySettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    company_name: profile.company_name || '',
    phone: profile.phone || '',
    company_address: profile.company_address || '',
    company_phone: profile.company_phone || '',
    company_website: profile.company_website || '',
    company_rfc: profile.company_rfc || '',
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(profile.logo_url)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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

  const removeLogo = async () => {
    if (profile.logo_url) {
      try {
        const path = profile.logo_url.split('/logos/')[1]
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

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null

    try {
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${profile.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Eliminar logo anterior si existe
      if (profile.logo_url) {
        try {
          const path = profile.logo_url.split('/logos/')[1]
          if (path) {
            await supabase.storage.from('logos').remove([path])
          }
        } catch (err) {
          console.error('Error removing old logo:', err)
        }
      }

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
    setSuccess(false)

    try {
      if (!formData.company_name) {
        throw new Error('El nombre de empresa es obligatorio')
      }

      let updateData: any = {
        company_name: formData.company_name,
        phone: formData.phone || null,
        company_address: formData.company_address || null,
        company_phone: formData.company_phone || null,
        company_website: formData.company_website || null,
        company_rfc: formData.company_rfc || null,
      }

      // Si hay nuevo logo
      if (logoFile) {
        const logoUrl = await uploadLogo()
        updateData.logo_url = logoUrl
      } else if (!logoPreview && profile.logo_url) {
        // Si se removió el logo
        updateData.logo_url = null
      }

      // Actualizar en base de datos
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)

      if (updateError) throw updateError

      setSuccess(true)
      
      // Refresh después de 2 segundos
      setTimeout(() => {
        router.refresh()
        setSuccess(false)
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✅ Información actualizada correctamente
        </div>
      )}

      {/* Logo de Empresa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
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
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
              <span className="text-sm text-gray-600 font-medium">Click para subir logo</span>
              <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (máx. 5MB)</span>
              <span className="text-xs text-blue-600 mt-2">Aparecerá en todos tus PDFs</span>
            </label>
          </div>
        ) : (
          <div className="relative">
            <div className="w-full h-48 border-2 border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center p-4">
              <img
                src={logoPreview}
                alt="Logo de empresa"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={removeLogo}
              className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Información Básica */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Información Básica</h3>
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
            placeholder="Constructora Ejemplo S.A. de C.V."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección de Empresa
          </label>
          <input
            type="text"
            value={formData.company_address}
            onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Av. Principal #123, Col. Centro"
          />
        </div>
      </div>

      {/* Información de Contacto */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Contacto</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono Personal
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(81) 1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono de Oficina
            </label>
            <input
              type="tel"
              value={formData.company_phone}
              onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(81) 8765-4321"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Globe className="w-4 h-4 inline mr-1" />
            Sitio Web
          </label>
          <input
            type="url"
            value={formData.company_website}
            onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://www.tuempresa.com"
          />
        </div>
      </div>

      {/* Información Fiscal */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Información Fiscal</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            RFC
          </label>
          <input
            type="text"
            value={formData.company_rfc}
            onChange={(e) => setFormData({ ...formData, company_rfc: e.target.value.toUpperCase() })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
            placeholder="ABCD123456XYZ"
            maxLength={13}
          />
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading || success}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Guardando...' : success ? '✓ Guardado' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}