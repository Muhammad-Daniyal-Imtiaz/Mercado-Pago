'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  name: string
  href: string
}

interface SidebarProps {
  items: NavItem[]
  activeColor?: string // Ejemplo: 'bg-blue-600', 'bg-zinc-900', etc.
  label?: string
}

export function Sidebar({ items, activeColor = 'bg-zinc-900 dark:bg-zinc-100', label }: SidebarProps) {
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path

  return (
    <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-colors min-h-[calc(100vh-64px)] hidden md:block">
      <nav className="p-4 space-y-2">
        {label && (
          <div className="px-4 py-2 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {label}
          </div>
        )}
        
        {items.map((item) => {
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2.5 rounded-xl transition-all font-bold ${
                active
                  ? `${activeColor} text-white dark:text-zinc-900 shadow-lg scale-[1.02]`
                  : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}