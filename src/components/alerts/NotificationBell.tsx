'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface NotificationBellProps {
  showFull?: boolean
}

export function NotificationBell({ showFull }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetch('/api/notifications') // You'll need to implement this
      .then(res => res.json())
      .then(data => {
        setNotifications(data)
        setUnreadCount(data.filter((n: any) => !n.is_read).length)
      })
  }, [])

  if (showFull) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <div className="divide-y">
          {notifications.length === 0 ? (
            <p className="p-4 text-gray-500">No notifications</p>
          ) : (
            notifications.map((n: any) => (
              <div key={n.id} className={`p-4 ${!n.is_read ? 'bg-blue-50' : ''}`}>
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <Link href="/dashboard/notifications" className="relative inline-block">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </Link>
  )
}