'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUserRole(data.user.role)
      })
  }, [])

  const isActive = (path: string) => pathname === path

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', roles: ['sysadmin', 'account_admin', 'account_user', 'account_observer'] },
    { name: 'Alerts', href: '/dashboard/alerts', roles: ['sysadmin', 'account_admin', 'account_user', 'account_observer'] },
    { name: 'Notifications', href: '/dashboard/notifications', roles: ['sysadmin', 'account_admin', 'account_user', 'account_observer'] },
    { name: 'Users', href: '/dashboard/users', roles: ['sysadmin', 'account_admin'] },
    { name: 'Analytics', href: '/dashboard/analytics', roles: ['sysadmin', 'account_admin'] },
    { name: 'Settings', href: '/dashboard/settings', roles: ['sysadmin', 'account_admin', 'account_user', 'account_observer'] },
  ]

  const filteredItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  )

  return (
    <aside className="w-64 bg-white shadow-sm min-h-screen">
      <nav className="p-4 space-y-1">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded-md ${
              isActive(item.href)
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}