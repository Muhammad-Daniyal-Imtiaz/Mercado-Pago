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
    <header className="bg-white shadow-sm">
      <div className="flex justify-between items-center px-6 py-3">
        <Link href="/dashboard" className="text-xl font-semibold">
          AlertApp
        </Link>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <span className="text-sm text-gray-600">
                {user.fullName} ({user.role.replace('_', ' ')})
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-red-600 hover:text-red-800"
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