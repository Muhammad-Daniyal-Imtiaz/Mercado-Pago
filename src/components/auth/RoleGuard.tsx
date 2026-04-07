'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode
}

export default function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()
        
        if (!res.ok || !data.user) {
          router.push('/login')
          return
        }

        setUserRole(data.user.role)
      } catch (error) {
        console.error('Role check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkRole()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    )
  }

  if (userRole === 'sysadmin') return <>{children}</>
  if (!userRole || !allowedRoles.includes(userRole)) {
    return (
      fallback || (
        <div className="mt-12 p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30">
          <h3 className="text-xl font-bold text-red-900 dark:text-red-400 mb-2">Acceso Denegado</h3>
          <p className="text-red-700 dark:text-red-500">No tienes los permisos requeridos para ver esta sección.</p>
        </div>
      )
    )
  }

  return <>{children}</>
}