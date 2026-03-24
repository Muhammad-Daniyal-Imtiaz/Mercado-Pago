'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  username: string
  fullName: string
  avatarUrl: string | null
  role: string
  account: {
    name: string
    slug: string
  } | null
  isVerified: boolean
  lastLogin: string | null
}

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      
      if (res.ok && data.user) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading...</div>
  }

  if (!user) {
    return null
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'sysadmin': return 'bg-purple-100 text-purple-800'
      case 'account_admin': return 'bg-blue-100 text-blue-800'
      case 'account_user': return 'bg-green-100 text-green-800'
      case 'account_observer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4">
        {user.avatarUrl ? (
          <img 
            src={user.avatarUrl} 
            alt={user.fullName}
            className="w-16 h-16 rounded-full"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl">
            {user.fullName.charAt(0)}
          </div>
        )}
        
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{user.fullName}</h2>
          <p className="text-gray-600">@{user.username}</p>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>

        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
            {user.role.replace('_', ' ')}
          </span>
          {user.account && (
            <p className="text-sm text-gray-500 mt-2">
              Account: {user.account.name}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Account Status</p>
          <p className="font-medium">
            {user.isVerified ? 'Verified' : 'Pending Verification'}
          </p>
        </div>
        {user.lastLogin && (
          <div>
            <p className="text-sm text-gray-500">Last Login</p>
            <p className="font-medium">
              {new Date(user.lastLogin).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}