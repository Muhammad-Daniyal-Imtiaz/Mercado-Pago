'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/dashboard/Header'
import { SysAdminSidebar } from './sysadmin/Sidebar'
import { AdminSidebar } from './account_admin/Sidebar'
import { UserSidebar } from './account_user/Sidebar'
import { ObserverSidebar } from './account_observer/Sidebar'


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
    switch (role) {
      case 'sysadmin': return <SysAdminSidebar />
      case 'account_admin': return <AdminSidebar />
      case 'account_user': return <UserSidebar />
      case 'account_observer': return <ObserverSidebar />
      default: return <div className="w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800" />
    }
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
