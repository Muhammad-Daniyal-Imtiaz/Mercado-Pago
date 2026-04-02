'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  username: string
  fullName: string
  avatarUrl: string | null
  role: string
  account: {
    name: string
    slug: string
  } | null
  isVerified: boolean
  lastLogin: string | null
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
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-8 border border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center space-y-6 md:space-y-0 md:space-x-8">
          {/* Skeleton Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-zinc-200 dark:bg-zinc-700 animate-pulse"></div>
            <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse">
              <div className="w-12 h-3 bg-zinc-300 dark:bg-zinc-600 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Skeleton User Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-48 h-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
              <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse"></div>
            </div>
            <div className="w-32 h-5 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
              <div className="w-40 h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Skeleton Status */}
          <div className="flex flex-col space-y-3 shrink-0">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
              <div className="w-12 h-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1"></div>
              <div className="w-24 h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Skeleton Stats */}
        <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1"></div>
            <div className="w-32 h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
          </div>
          <div>
            <div className="w-20 h-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1"></div>
            <div className="w-28 h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
          </div>
          <div>
            <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1"></div>
            <div className="w-24 h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'sysadmin': return 'bg-purple-100 text-purple-800'
      case 'account_admin': return 'bg-blue-100 text-blue-800'
      case 'account_user': return 'bg-green-100 text-green-800'
      case 'account_observer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-8 border border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center space-y-6 md:space-y-0 md:space-x-8">
        <div className="relative group">
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
          <div className="absolute -bottom-8 right-2 px-2 py-1 bg-white dark:bg-zinc-800 rounded-md shadow-md">
            <span className={`text-[8px] font-black tracking-widest ${getRoleBadgeColor(user.role).split(' ')[1]}`}>
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">{user.fullName}</h2>
            {user.isVerified && (
              <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">@{user.username || user.email.split('@')[0]}</p>
          <div className="flex items-center space-x-2 pt-2 text-zinc-400 dark:text-zinc-500 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{user.email}</span>
          </div>
        </div>

        <div className="flex flex-col space-y-3 shrink-0">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">Status</p>
            <p className="font-bold text-zinc-900 dark:text-white">
              {user.isVerified ? 'Verificado' : 'Pendiente de verificación'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">ID de cuenta</p>
          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
            {user.account?.name || 'Personal workspace'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Permisos de rol</p>
          <p className="text-sm font-bold text-zinc-900 dark:text-white">
            Nivel de acceso {user.role === 'sysadmin' ? 'Root' : 'Standard'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Último inicio de sesión</p>
          <p className="text-sm font-bold text-zinc-900 dark:text-white">
            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Primera sesión'}
          </p>
        </div>
      </div>
    </div>
  )
}