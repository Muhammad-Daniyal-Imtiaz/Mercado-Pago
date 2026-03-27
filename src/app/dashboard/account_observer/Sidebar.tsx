'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ObserverSidebar() {
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path

  const navItems = [
    { name: 'Observer View', href: '/dashboard/account_observer' },
    { name: 'System Feed', href: '/dashboard/alerts' },
    { name: 'Preferences', href: '/dashboard/settings' },
  ]

  return (
    <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-colors min-h-[calc(100vh-64px)]">
      <nav className="p-4 space-y-2">
        <div className="px-4 py-2 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Observation Mode</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-2.5 rounded-xl transition-all font-bold ${
              isActive(item.href)
                ? 'bg-purple-600 text-white shadow-lg scale-[1.02]'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
