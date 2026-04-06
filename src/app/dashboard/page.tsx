'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    async function checkRoleAndRedirect() {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()

        if (res.ok && data.user) {
          const role = data.user.role
          // Redirect to role-specific dashboard folder
          router.replace(`/dashboard/${role}`)
        } else {
          router.replace('/login')
        }
      } catch (error) {
        console.error('Redirect failed:', error)
        router.replace('/login')
      }
    }

    checkRoleAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white"></div>
        <p className="text-zinc-500 font-medium animate-pulse uppercase tracking-widest text-xs">Preparando la información...</p>
      </div>
    </div>
  )
}


