'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  username: string
  fullName: string
  avatarUrl: string | null
  role: string
  organization: {
    organization_id: string
    name: string
    role: string
    status: string
  } | null
  isVerified: boolean
  lastLogin: string | null
  memberships?: {
    organization_id: string
    name: string
    role: string
    status: string
  }[]
}

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()

      if (res.ok && data.user) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-5 sm:p-8 border border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-8 lg:space-y-0 lg:space-x-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-6 flex-1">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"></div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-700 animate-pulse"></div>
            </div>
            <div className="flex-1 space-y-3 w-full">
              <div className="w-48 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse mx-auto sm:mx-0"></div>
              <div className="w-32 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse mx-auto sm:mx-0"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-row gap-6 sm:gap-8 lg:gap-12 pt-6 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800">
            <div className="space-y-2">
              <div className="w-20 h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="w-32 h-5 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="w-20 h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="w-32 h-5 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="w-20 h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="w-32 h-5 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'sysadmin': return { color: 'bg-purple-300', tooltip: "Administrador del sistema" }
      case 'account_admin': return { color: 'bg-blue-400', tooltip: "Administrador de cuenta" }
      case 'account_user': return { color: 'bg-green-300', tooltip: "Usuario de cuenta" }
      case 'account_observer': return { color: 'bg-yellow-400', tooltip: "Observador de cuenta" }
      default: return { color: 'bg-gray-100', tooltip: "Usuario" }
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-5 sm:p-8 border border-zinc-200 dark:border-zinc-800 transition-colors">
      {/* Banner of invitation */}
      {user.memberships?.find(m => m.organization_id === user.organization?.organization_id)?.status === 'pending' && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest text-center sm:text-left">Tienes una invitación pendiente para este equipo</p>
          </div>
          <button className="w-full sm:w-auto text-[9px] font-black bg-red-600 text-white px-3 py-1.5 rounded-lg uppercase hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95">
            Aceptar Acceso
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center space-y-8 lg:space-y-0 lg:space-x-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-6 flex-1">
          <div className="relative group shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-zinc-50 dark:ring-zinc-800"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-black shadow-xl ring-4 ring-white dark:ring-zinc-800">
                {user.fullName.charAt(0)}
              </div>
            )}
            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-4 border-white dark:border-zinc-900 ${getRoleBadgeColor(user.role).color} z-10`}></div>

            <div className="absolute -top-10 right-0 transform scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-30">
              <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-2xl border border-white/10 whitespace-nowrap">
                {getRoleBadgeColor(user.role).tooltip}
              </div>
              <div className="w-3 h-3 bg-zinc-900 dark:bg-zinc-100 rotate-45 absolute -bottom-1 right-2"></div>
            </div>
          </div>

          <div className="flex-1 space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-3">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">{user.fullName}</h2>
              {user.isVerified && (
                <svg className="w-6 h-6 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            {user.username &&
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">@{user.username}</p>
            }
            <div className="flex items-center justify-center sm:justify-start space-x-2 pt-1 text-zinc-400 dark:text-zinc-500 text-sm">
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-row gap-6 sm:gap-8 lg:gap-12 pt-6 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Invitación</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
              {user.memberships?.find(m => m.organization_id === user.organization?.organization_id)?.status === 'pending' ? 'Pendiente' : 'Aceptada'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Equipo Activo</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
              {user.organization?.name || 'Espacio Personal'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Permisos de rol</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">
              Nivel {
                user.role === 'sysadmin' ? 'Root (Global)' :
                  user.role === 'account_admin' ? 'Administrador' :
                    user.role === 'account_user' ? 'Estándar' : 'Limitado (Vista)'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}