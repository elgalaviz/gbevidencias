'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'

type Role = 'god' | 'cliente' | 'contratista' | 'ayudante'

interface SidebarProps {
  userRole: Role
  userName: string
  userEmail: string
}

const roleLabel: Record<Role, string> = {
  god: '👑 GOD',
  cliente: '🏢 Cliente',
  contratista: '👷 Contratista',
  ayudante: '🔧 Ayudante',
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['god', 'cliente', 'contratista', 'ayudante'] },
  { href: '/dashboard/projects', label: 'Proyectos', icon: FolderKanban, roles: ['god', 'cliente', 'contratista', 'ayudante'] },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users, roles: ['god'] },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings, roles: ['god', 'cliente', 'contratista', 'ayudante'] },
]

export default function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleItems = navItems.filter((item) => item.roles.includes(userRole))

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {visibleItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              active
                ? 'bg-white text-primary-600 shadow-md'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon size={18} />
            {label}
            {active && <ChevronRight size={14} className="ml-auto" />}
          </Link>
        )
      })}
    </nav>
  )

  const UserInfo = () => (
    <div className="px-4 pb-4">
      <div className="bg-white/10 rounded-xl p-3 mb-3">
        <p className="text-white font-semibold text-sm truncate">{userName}</p>
        <p className="text-white/60 text-xs truncate">{userEmail}</p>
        <span className="text-white/80 text-xs font-medium">{roleLabel[userRole]}</span>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 w-full px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all text-sm"
      >
        <LogOut size={16} />
        Cerrar Sesión
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-primary-600 text-white">
        <span className="font-bold text-lg">ProManager</span>
        <button onClick={() => setOpen(!open)} className="p-1">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-primary-500 to-secondary-500 z-30 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-5 border-b border-white/20">
          <h1 className="text-2xl font-bold text-white">ProManager</h1>
        </div>
        <NavLinks />
        <UserInfo />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-gradient-to-b from-primary-500 to-secondary-500">
        <div className="px-6 py-6 border-b border-white/20">
          <h1 className="text-2xl font-bold text-white">ProManager</h1>
          <p className="text-white/60 text-xs mt-1">Gestión de Proyectos</p>
        </div>
        <NavLinks />
        <UserInfo />
      </aside>
    </>
  )
}
