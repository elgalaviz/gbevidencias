'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const roles = [
  { value: 'cliente', label: '🏢 Cliente', desc: 'Aprueba y revisa etapas de sus proyectos' },
  { value: 'contratista', label: '👷 Contratista', desc: 'Gestiona proyectos y sube evidencias' },
  { value: 'ayudante', label: '🔧 Ayudante', desc: 'Solo sube evidencias fotográficas' },
]

export default function UserForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'cliente',
    company_name: '',
    phone: '',
  })

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Error al crear usuario')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/users')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-gray-700 font-semibold">¡Usuario creado exitosamente!</p>
        <p className="text-gray-400 text-sm mt-1">Redirigiendo...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nombre y email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            className="input"
            required
            placeholder="Juan Pérez"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className="input"
            required
            placeholder="usuario@email.com"
          />
        </div>
      </div>

      {/* Contraseña */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Contraseña <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          className="input"
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      {/* Rol */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Rol <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {roles.map((r) => (
            <label
              key={r.value}
              className={`flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                form.role === r.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={form.role === r.value}
                onChange={(e) => set('role', e.target.value)}
                className="sr-only"
              />
              <span className={`font-semibold text-sm ${form.role === r.value ? 'text-primary-700' : 'text-gray-700'}`}>
                {r.label}
              </span>
              <span className="text-xs text-gray-400">{r.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Empresa y teléfono */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Empresa <span className="text-gray-400 text-xs">(opcional)</span>
          </label>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => set('company_name', e.target.value)}
            className="input"
            placeholder="Constructora XYZ"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Teléfono <span className="text-gray-400 text-xs">(opcional)</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            className="input"
            placeholder="+57 300 123 4567"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-secondary flex-1"
          disabled={loading}
        >
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary flex-1 py-3" disabled={loading}>
          {loading ? 'Creando usuario...' : 'Crear Usuario'}
        </button>
      </div>
    </form>
  )
}
