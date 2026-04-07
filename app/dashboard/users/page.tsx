import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Database, UserRole } from '@/types/database'
import { Plus, Users, Mail, Phone, Building2, Edit } from 'lucide-react'

type ProfileRow = {
  id: string
  full_name: string
  email: string
  role: UserRole
  company_name: string | null
  phone: string | null
  avatar_url: string | null
  logo_url: string | null
  created_at: string
}

const roleConfig: Record<UserRole, { label: string; badge: string }> = {
  god: { label: '👑 GOD', badge: 'bg-purple-100 text-purple-800' },
  cliente: { label: '🏢 Cliente', badge: 'badge-progress' },
  contratista: { label: '👷 Contratista', badge: 'badge-completed' },
  ayudante: { label: '🔧 Ayudante', badge: 'badge-pending' },
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { role?: string; q?: string }
}) {
  const supabase = createServerComponentClient<Database>({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single() as { data: { role: UserRole } | null }

  if (profile?.role !== 'god' && profile?.role !== 'contratista') redirect('/dashboard')

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, role, company_name, phone, avatar_url, logo_url, created_at')
    .order('created_at', { ascending: false })

  // Si es contratista, solo mostrar usuarios que él creó (clientes y ayudantes)
  if (profile?.role === 'contratista') {
    query = query
      .eq('created_by', session.user.id)
      .in('role', ['cliente', 'ayudante'])
  }

  // Filtro por rol seleccionado
  if (searchParams.role && searchParams.role !== 'all') {
    query = query.eq('role', searchParams.role as UserRole)
  }

  const { data: users } = await query as { data: ProfileRow[] | null }

  const filtered = searchParams.q
    ? users?.filter((u) =>
        u.full_name.toLowerCase().includes(searchParams.q!.toLowerCase()) ||
        u.email.toLowerCase().includes(searchParams.q!.toLowerCase()) ||
        u.company_name?.toLowerCase().includes(searchParams.q!.toLowerCase())
      )
    : users

  // Tabs según el rol
  const tabs = profile?.role === 'god' 
    ? [
        { key: 'all', label: 'Todos' },
        { key: 'cliente', label: '🏢 Clientes' },
        { key: 'contratista', label: '👷 Contratistas' },
        { key: 'ayudante', label: '🔧 Ayudantes' },
        { key: 'god', label: '👑 GOD' },
      ]
    : [
        { key: 'all', label: 'Todos' },
        { key: 'cliente', label: '🏢 Clientes' },
        { key: 'ayudante', label: '🔧 Ayudantes' },
      ]

  // Conteos por rol
  const counts = {
    cliente: users?.filter((u) => u.role === 'cliente').length ?? 0,
    contratista: users?.filter((u) => u.role === 'contratista').length ?? 0,
    ayudante: users?.filter((u) => u.role === 'ayudante').length ?? 0,
    god: users?.filter((u) => u.role === 'god').length ?? 0,
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#333]">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered?.length ?? 0} usuario(s)</p>
        </div>
        <Link href="/dashboard/users/new" className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          Nuevo Usuario
        </Link>
      </div>

      {/* Stats - Solo mostrar stats relevantes según rol */}
      <div className={`grid grid-cols-2 ${profile?.role === 'god' ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4 mb-6`}>
        {profile?.role === 'god' ? (
          <>
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-500 bg-blue-100">
                <Users size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{counts.cliente}</p>
                <p className="text-gray-400 text-xs">Clientes</p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-green-500 bg-green-100">
                <Users size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{counts.contratista}</p>
                <p className="text-gray-400 text-xs">Contratistas</p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-yellow-500 bg-yellow-100">
                <Users size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{counts.ayudante}</p>
                <p className="text-gray-400 text-xs">Ayudantes</p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-purple-500 bg-purple-100">
                <Users size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{counts.god}</p>
                <p className="text-gray-400 text-xs">GOD</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-500 bg-blue-100">
                <Users size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{counts.cliente}</p>
                <p className="text-gray-400 text-xs">Mis Clientes</p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-yellow-500 bg-yellow-100">
                <Users size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{counts.ayudante}</p>
                <p className="text-gray-400 text-xs">Mis Ayudantes</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white/60 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <form>
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q}
              placeholder="Buscar por nombre, email, empresa..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary-400 text-sm"
            />
          </form>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/dashboard/users?role=${tab.key}${searchParams.q ? `&q=${searchParams.q}` : ''}`}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                (searchParams.role ?? 'all') === tab.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Users list */}
      {!filtered || filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={52} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay usuarios</p>
          <p className="text-gray-400 text-sm mt-1">
            {profile?.role === 'contratista' 
              ? 'Crea clientes y ayudantes para tus proyectos'
              : 'Comienza creando usuarios para el sistema'}
          </p>
          <Link href="/dashboard/users/new" className="btn btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={16} />
            Crear Usuario
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((user) => {
            const cfg = roleConfig[user.role]
            const isCurrentUser = user.id === session.user.id
            return (
              <Link 
                key={user.id} 
                href={`/dashboard/users/${user.id}/edit`}
                className="card relative group cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] border-2 border-transparent hover:border-primary-300"
              >
                {isCurrentUser && (
                  <span className="absolute top-3 right-3 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                    Tú
                  </span>
                )}

                {/* Icono de editar (aparece en hover) */}
                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center shadow-lg">
                    <Edit size={14} className="text-white" />
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  {/* Avatar o Logo */}
                  {user.avatar_url || user.logo_url ? (
                    <img
                      src={user.avatar_url || user.logo_url || ''}
                      alt={user.full_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-800 truncate group-hover:text-primary-600 transition-colors">
                      {user.full_name}
                    </p>
                    <span className={`badge ${cfg.badge} text-xs`}>{cfg.label}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Mail size={13} className="shrink-0 text-gray-400" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.company_name && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Building2 size={13} className="shrink-0 text-gray-400" />
                      <span className="truncate">{user.company_name}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Phone size={13} className="shrink-0 text-gray-400" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Logo pequeño si existe (para contratistas) */}
                {user.logo_url && !user.avatar_url && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <img
                      src={user.logo_url}
                      alt="Logo"
                      className="h-6 object-contain opacity-50 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <p className="text-gray-300 text-xs">
                    Creado {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </p>
                  <span className="text-xs text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    Click para editar →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}