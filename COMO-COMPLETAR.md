# 🔨 Cómo Completar el Proyecto ProManager

Ya tienes la **base completa** del proyecto. Esta guía te ayuda a construir el resto.

## ✅ Lo que YA tienes configurado:

1. ✅ Estructura completa de Next.js 14
2. ✅ Configuración de TypeScript
3. ✅ Tailwind CSS configurado
4. ✅ **Schema completo de Supabase** (supabase-schema.sql)
5. ✅ Tipos de TypeScript para toda la base de datos
6. ✅ Cliente de Supabase configurado
7. ✅ Estilos globales y componentes CSS
8. ✅ Sistema de variables de entorno

## 📋 Archivos que debes crear

### 1. Página de Login Completa

**Archivo**: `app/login/page.tsx`

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setMessage('¡Cuenta creada! Revisa tu correo para confirmar.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 fade-in">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-primary-500 mb-2">ProManager</h1>
          <p className="text-gray-600">Gestión de Proyectos de Contratistas</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                required={isSignUp}
                placeholder="Juan Pérez"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 text-lg"
          >
            {loading ? 'Procesando...' : isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setMessage(null)
            }}
            className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
          >
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 2. Callback de Autenticación

**Archivo**: `app/auth/callback/route.ts`

```ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

### 3. Dashboard Principal

**Archivo**: `app/dashboard/page.tsx`

```tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database } from '@/types/database'

export default async function DashboardPage() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  // Obtener proyectos según rol
  let projectsQuery = supabase
    .from('projects')
    .select(`
      *,
      client:profiles!client_id(full_name, email),
      contractor:profiles!contractor_id(full_name, email),
      stages(count)
    `)

  if (profile?.role === 'cliente') {
    projectsQuery = projectsQuery.eq('client_id', session.user.id)
  } else if (profile?.role === 'contratista') {
    projectsQuery = projectsQuery.eq('contractor_id', session.user.id)
  } else if (profile?.role === 'ayudante') {
    // Ayudantes solo ven proyectos donde están en el team
    const { data: teamProjects } = await supabase
      .from('project_team')
      .select('project_id')
      .eq('user_id', session.user.id)
    
    const projectIds = teamProjects?.map(tp => tp.project_id) || []
    projectsQuery = projectsQuery.in('id', projectIds)
  }
  // GOD ve todos los proyectos (no filtramos)

  const { data: projects } = await projectsQuery

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Bienvenido, {profile?.full_name}
        </h1>
        <p className="text-white/80">
          Rol: <span className="font-semibold">{profile?.role?.toUpperCase()}</span>
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Proyectos</h3>
          <p className="text-4xl font-bold text-primary-500">{projects?.length || 0}</p>
        </div>
        {/* Agregar más tarjetas de estadísticas */}
      </div>

      {/* Lista de proyectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map(project => (
          <div key={project.id} className="card">
            <h3 className="text-xl font-bold mb-2">{project.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{project.description}</p>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Cliente:</span> {project.client?.full_name}</p>
              {project.contractor && (
                <p><span className="font-semibold">Contratista:</span> {project.contractor.full_name}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 🎯 Próximos Pasos Recomendados

### Fase 1: Funcionalidad Básica (1-2 días)
1. ✅ Terminar páginas de login y dashboard (arriba)
2. Crear componentes de UI reutilizables (Button, Modal, Card)
3. Implementar navegación y sidebar
4. Crear página de proyectos con lista
5. Formulario de crear proyecto (solo GOD)

### Fase 2: Gestión de Equipos (1 día)
1. Página de usuarios (solo GOD)
2. Formulario crear usuarios con roles
3. Agregar miembros al equipo del proyecto
4. Lista de miembros por proyecto

### Fase 3: Etapas y Evidencias (2 días)
1. Página de detalle de proyecto
2. Lista de etapas con estados
3. Formulario crear/editar etapas
4. Componente de subida de fotos
5. Galería de evidencias
6. Visor de imágenes en pantalla completa

### Fase 4: Aprobaciones y PDFs (1 día)
1. Botones de aprobar/rechazar (solo clientes)
2. Modal de motivo de rechazo
3. Generador de PDF con jsPDF
4. Descarga de PDFs

### Fase 5: Responsive y Pulido (1 día)
1. Optimizar para móvil
2. Animaciones y transiciones
3. Manejo de errores mejorado
4. Loading states
5. Validaciones de formularios

## 🚀 Recursos para Aprender

### Next.js 14
- Docs oficiales: https://nextjs.org/docs
- App Router: https://nextjs.org/docs/app
- Server Components: https://nextjs.org/docs/app/building-your-application/rendering/server-components

### Supabase
- Docs: https://supabase.com/docs
- Auth: https://supabase.com/docs/guides/auth
- Database: https://supabase.com/docs/guides/database
- Storage: https://supabase.com/docs/guides/storage
- RLS: https://supabase.com/docs/guides/auth/row-level-security

### TypeScript + React
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- React Docs: https://react.dev

## 💡 Tips Importantes

1. **Siempre usa TypeScript**: Te ahorrará bugs
2. **Server Components primero**: Usa 'use client' solo cuando necesites interactividad
3. **RLS es tu amigo**: Las políticas de Supabase protegen tus datos
4. **Mobile first**: Diseña para móvil y luego escala
5. **Componentes pequeños**: Divide y vencerás

## 🎓 Orden de Aprendizaje Sugerido

Si eres principiante, aprende en este orden:

1. **TypeScript básico** (1 semana)
   - Tipos, interfaces, generics
   - https://www.typescriptlang.org/docs/handbook/intro.html

2. **React básico** (2 semanas)
   - Components, props, state
   - Hooks (useState, useEffect)
   - https://react.dev/learn

3. **Next.js** (1 semana)
   - Pages vs App Router
   - Server vs Client Components
   - Routing
   - https://nextjs.org/learn

4. **Supabase** (1 semana)
   - PostgreSQL básico
   - Auth
   - Storage
   - RLS
   - https://supabase.com/docs

5. **Integración** (2-3 semanas)
   - Construir este proyecto paso a paso

**Tiempo total estimado: 7-8 semanas** de estudio constante para dominar el stack completo.

## 📞 Dónde Pedir Ayuda

- Stack Overflow: https://stackoverflow.com
- Supabase Discord: https://discord.supabase.com
- Next.js Discord: https://nextjs.org/discord
- Reddit: r/nextjs, r/reactjs

¡Éxito construyendo tu ProManager! 🚀
