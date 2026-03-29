'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

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

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Left Side: Logo & Organization Context */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white hover:opacity-80 transition-opacity">
            ALERT<span className="text-blue-600">APP</span>
          </Link>
          
          {user && user.organization && (
            <div className="flex items-center">
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-4 hidden md:block" />
              <div className="hidden md:flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-1">Current Portal</span>
                <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">
                  {user.organization.name} <span className="text-zinc-600 dark:text-zinc-400 mx-1">/</span> {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: User Profile & Actions */}
        <div className="flex items-center space-x-6">
          {user && (
            <>
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                    {user.fullName}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-10 h-10 rounded-full ring-2 ring-zinc-100 dark:ring-zinc-800 border-none" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-lg">
                    {user.fullName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
              <button
                onClick={handleSignOut}
                className="text-sm font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}