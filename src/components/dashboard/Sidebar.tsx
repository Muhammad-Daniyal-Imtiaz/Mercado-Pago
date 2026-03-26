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
    userRole === 'sysadmin' || (userRole && item.roles.includes(userRole))
  )

  return (
    <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-colors min-h-[calc(100vh-64px)]">
      <nav className="p-4 space-y-2">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-2.5 rounded-xl transition-all font-medium ${
              isActive(item.href)
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md scale-[1.02]'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}