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
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    fetchSession()
  }, [])

  const fetchSession = async () => {
    const res = await fetch('/api/auth/session')
    const data = await res.json()
    if (data.user) {
      setUser(data.user)
      setRole(data.user.role)
    }
  }

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === user?.organization?.organization_id) return

    setSwitching(true)
    try {
      const res = await fetch('/api/auth/switch-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: orgId }),
      })
      if (res.ok) {
        window.location.href = '/dashboard'
      }
    } catch (err) {
      console.error('Switch failed:', err)
    } finally {
      setSwitching(false)
    }
  }

  const renderSidebar = (isMobile = false) => {
    if (!role || !MENU_ITEMS[role]) {
      return !isMobile ? <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800" /> : null
    }

    const activeColorMap: Record<string, string> = {
      sysadmin: 'bg-zinc-900 dark:bg-zinc-100',
      account_admin: 'bg-blue-600',
      account_user: 'bg-green-600',
      account_observer: 'bg-yellow-500',
    }

    const labels: Record<string, string> = {
      sysadmin: 'Root (Global)',
      account_admin: 'Admin Equipo',
      account_user: 'Usuario',
      account_observer: 'Observador',
    }

    return (
      <Sidebar
        items={MENU_ITEMS[role]}
        activeColor={activeColorMap[role]}
        label={labels[role]}
        onItemClick={() => isMobile && setIsMobileMenuOpen(false)}
        className={isMobile 
          ? "w-full min-h-0" 
          : "w-64 sticky top-16 h-[calc(100vh-64px)] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800"
        }
      />
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors">
      <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-zinc-900/40 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        >
            <div 
            className="fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-zinc-950 shadow-2xl animate-in slide-in-from-left duration-500 ease-out flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between shrink-0">
              <span className="text-xl font-black italic tracking-tighter">MENÚ</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Org Switcher in Mobile Menu */}
              {user && (
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <div className="flex items-center gap-3 mb-4 px-2">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {user.fullName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-black text-zinc-900 dark:text-white leading-tight">{user.fullName}</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{user.role.replace('_', ' ')}</p>
                    </div>
                  </div>

                  {user.memberships && user.memberships.length > 0 && (
                    <div className="space-y-1">
                      <p className="px-2 pb-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">Tus Equipos</p>
                      {user.memberships.map((m: any) => (
                        <button
                          key={m.organization_id}
                          onClick={() => handleSwitchOrg(m.organization_id)}
                          disabled={switching}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${
                            m.organization_id === user.organization?.organization_id
                              ? 'bg-white dark:bg-zinc-800 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className={`font-black text-[11px] uppercase tracking-tight ${
                              m.organization_id === user.organization?.organization_id ? 'text-blue-600' : 'text-zinc-600 dark:text-zinc-400'
                            }`}>{m.name}</span>
                            <span className="text-[9px] font-medium text-zinc-500 italic">{m.role.replace('_', ' ')}</span>
                          </div>
                          {m.organization_id === user.organization?.organization_id && (
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="p-2">
                {renderSidebar(true)}
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 text-[10px] font-black uppercase text-zinc-400 tracking-widest text-center shrink-0">
              Pay-Alert v1.0.2
            </div>

            {switching && (
              <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex">
        <div className="hidden md:block">
          {renderSidebar()}
        </div>
        <main className="flex-1">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

