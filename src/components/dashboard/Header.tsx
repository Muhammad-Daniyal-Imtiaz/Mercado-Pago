'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [switching, setSwitching] = useState(false)
  const [showOrgDropdown, setShowOrgDropdown] = useState(false)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user)
      })
  }, [])

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/login')
  }

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === user.organization?.organization_id) return

    setSwitching(true)
    setShowOrgDropdown(false)
    try {
      const res = await fetch('/api/auth/switch-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: orgId }),
      })
      if (res.ok) {
        // Refresh the whole page to load the new role-specific sidebar and pages
        window.location.href = '/dashboard'
      }
    } catch (err) {
      console.error('Switch failed:', err)
    } finally {
      setSwitching(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="mx-auto flex justify-between items-center px-6 py-4">
        {/* Left Side: Logo & Organization Context */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white hover:opacity-80 transition-opacity">
            <div className="flex flex-row items-baseline">
              <span className="dark:text-white text-black font-bold text-xl">Pay</span>
              <span>-</span>
              <span className="text-blue-400 font-bold text-xl">Alert</span>
              <span className="text-gray-400 text-sm ml-1">.com.ar</span>
            </div>
          </Link>

          {!user && (
            <div className="flex items-center gap-4">
              <div className="h-6 w-px bg-zinc-100 dark:bg-zinc-800 mx-1 hidden md:block" />
              <div className="space-y-1.5 container">
                <div className="w-20 h-2 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
                <div className="w-32 h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
              </div>
            </div>
          )}

          {user && user.organization && (
            <div className="flex items-center relative gap-4">
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden md:block" />

              <div className="relative">
                <button
                  onClick={() => user.memberships?.length > 1 && setShowOrgDropdown(!showOrgDropdown)}
                  className={`flex flex-col text-left group transition-all ${user.memberships?.length > 1 ? 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-xl' : 'pointer-events-none'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 opacity-60">Portal Actual</span>
                    {user.memberships?.length > 1 && (
                      <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                        {user.memberships.length} Equipos
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-1.5">
                    {user.organization.name}
                    <span className="text-zinc-600 dark:text-zinc-400 no-italic opacity-40 font-light">/</span>
                    {user.role.replace('_', ' ')}
                    {user.memberships?.length > 1 && (
                      <svg className={`w-3 h-3 transition-transform ${showOrgDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </span>
                </button>

                {/* Organization Switcher Dropdown */}
                {showOrgDropdown && user.memberships && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 z-[60] animate-in slide-in-from-top-2">
                    <p className="px-3 pt-2 pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 mb-2">Cambiar de equipo</p>
                    <div className="space-y-1">
                      {user.memberships.map((m: any) => (
                        <button
                          key={m.organization_id}
                          onClick={() => handleSwitchOrg(m.organization_id)}
                          disabled={switching}
                          className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${m.organization_id === user.organization?.organization_id
                              ? 'bg-zinc-100 dark:bg-zinc-800 cursor-default'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                            }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-black text-xs uppercase tracking-tight text-zinc-900 dark:text-white">{m.name}</span>
                            <span className="text-[10px] font-medium text-zinc-500 italic">{m.role.replace('_', ' ')}</span>
                          </div>
                          {m.organization_id === user.organization?.organization_id && (
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: User Profile & Actions */}
        <div className="flex items-center space-x-6">
          {user ? (
            <>
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                    {user.fullName}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                    {user.organization?.role ? user.organization.role.replace('_', ' ') : ''}
                  </p>
                </div>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-10 h-10 rounded-full ring-2 ring-zinc-100 dark:ring-zinc-800 border-none" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-zinc-100 dark:ring-zinc-800">
                    {user.fullName?.charAt(0) || user.email?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
              <button
                onClick={handleSignOut}
                className="text-xs font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            /* Skeleton loading state */
            <>
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <div className="w-24 h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mb-1"></div>
                  <div className="w-16 h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
                </div>
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse"></div>
              </div>
              <div className="h-6 w-px bg-zinc-100 dark:bg-zinc-800" />
              <div className="w-16 h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
            </>
          )}
        </div>
      </div>

      {switching && (
        <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[2px] z-[70] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-900 dark:border-white border-t-transparent"></div>
        </div>
      )}
    </header>
  )
}