'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'

interface SidebarProps {
  userRole: 'god' | 'cliente' | 'contratista' | 'ayudante'
  userName: string
}

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Navegación base (todos los roles)
  const baseNavigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['god', 'cliente', 'contratista', 'ayudante'],
    },
    {
      name: 'Proyectos',
      href: '/dashboard/projects',
      icon: FolderKanban,
      roles: ['god', 'cliente', 'contratista', 'ayudante'],
    },
  ]

  // Navegación de gestión (solo GOD y Contratistas)
  const managementNavigation = [
    {
      name: 'Usuarios',
      href: '/dashboard/users',
      icon: Users,
      roles: ['god', 'contratista'],
    },
  ]

  // Navegación de configuración (según rol)
  const settingsNavigation = [
    {
      name: 'Tu Empresa',
      href: '/dashboard/company',
      icon: Building2,
      roles: ['contratista'],
      badge: 'Nuevo',
    },
  ]

  // Filtrar navegación según rol
  const navigation = [
    ...baseNavigation.filter(item => item.roles.includes(userRole)),
    ...managementNavigation.filter(item => item.roles.includes(userRole)),
    ...settingsNavigation.filter(item => item.roles.includes(userRole)),
  ]

  const NavLink = ({ item }: { item: any }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    
    return (
      <Link
        href={item.href}
        onClick={() => setIsOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
        <span className="font-medium flex-1">{item.name}</span>
        {item.badge && (
          <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full">
            {item.badge}
          </span>
        )}
        {isActive && <ChevronRight className="w-4 h-4" />}
      </Link>
    )
  }

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Avanzzo
          </h1>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-600">{userName}</p>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              userRole === 'god' ? 'bg-purple-100 text-purple-700' :
              userRole === 'contratista' ? 'bg-blue-100 text-blue-700' :
              userRole === 'cliente' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {userRole === 'god' ? '⚡ GOD' :
               userRole === 'contratista' ? '👷 Contratista' :
               userRole === 'cliente' ? '🏢 Cliente' :
               '🔧 Ayudante'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink key={item.name} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg text-gray-700 hover:bg-gray-100"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </aside>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col h-screen w-72 bg-white border-r border-gray-200 fixed left-0 top-0">
        <SidebarContent />
      </aside>
    </>
  )
}