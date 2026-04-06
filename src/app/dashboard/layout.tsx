'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/dashboard/Header'
import { Sidebar } from '@/components/dashboard/Sidebar'

const MENU_ITEMS: Record<string, { name: string, href: string }[]> = {
  sysadmin: [
    { name: 'Panel Root', href: '/dashboard/sysadmin' },
    { name: 'Configuración', href: '/dashboard/sysadmin/settings' },
  ],
  account_admin: [
    { name: 'Mi Equipo', href: '/dashboard/account_admin' },
    { name: 'Configuración', href: '/dashboard/account_admin/settings' },
  ],
  account_user: [
    { name: 'Inicio', href: '/dashboard/account_user' },
    { name: 'Preferencias', href: '/dashboard/account_user/settings' },
  ],
  account_observer: [
    { name: 'Inicio', href: '/dashboard/account_observer' },
    { name: 'Preferencias', href: '/dashboard/account_observer/settings' },
  ],
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user) setRole(data.user.role)
      })
  }, [])

  const renderSidebar = () => {
    if (!role || !MENU_ITEMS[role]) {
      return <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800" />
    }

    const activeColorMap: Record<string, string> = {
      sysadmin: 'bg-zinc-900',
      account_admin: 'bg-blue-500',
      account_user: 'bg-green-500',
      account_observer: 'bg-blue-500',
    }

    const labels: Record<string, string> = {
      sysadmin: 'Administrador Global',
      account_admin: 'Administración de Cuenta',
      account_user: 'Área de Usuario',
      account_observer: 'Modo Observador',
    }

    return (
      <Sidebar
        items={MENU_ITEMS[role]}
        activeColor={activeColorMap[role]}
        label={labels[role]}
      />
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors">
      <Header />
      <div className="flex">
        {renderSidebar()}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

