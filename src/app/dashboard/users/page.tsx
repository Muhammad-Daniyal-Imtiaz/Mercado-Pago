'use client'

import { useEffect, useState } from 'react'
import { RoleGuard } from '@/components/auth/RoleGuard'

export default function UsersPage() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetch('/api/users') // You'll need to implement this endpoint
      .then(res => res.json())
      .then(data => setUsers(data))
  }, [])

  return (
    <RoleGuard allowedRoles={['sysadmin', 'account_admin']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="bg-white rounded-lg shadow">
          {/* User management table */}
        </div>
      </div>
    </RoleGuard>
  )
}