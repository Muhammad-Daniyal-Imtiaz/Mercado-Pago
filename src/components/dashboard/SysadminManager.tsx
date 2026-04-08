'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, Crown, Search, Loader2, RefreshCw } from 'lucide-react'
import { Dialog, type DialogAction } from '@/components/alerts/Dialog'

interface User {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  is_sysadmin: boolean
  role?: string
}

export function SysadminManager() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [promoting, setPromoting] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Dialog state
  const [dialog, setDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm'
    actions: DialogAction[]
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    actions: [],
  })

  const closeDialog = useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }))
  }, [])

  const showDialog = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      actions: [{ label: 'OK', variant: 'primary', onClick: () => closeDialog() }],
    })
  }, [closeDialog])

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      actions: [
        { label: 'Cancel', variant: 'ghost', onClick: closeDialog },
        { label: 'Confirm', variant: 'danger', onClick: () => { closeDialog(); onConfirm() } },
      ],
    })
  }, [closeDialog])

  const fetchUsers = async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/auth/promote-sysadmin')
      const data = await res.json()

      if (res.ok && data.users) {
        setUsers(data.users)
        setFilteredUsers(data.users)
      } else {
        showDialog('Error', data.error || 'Error loading users', 'error')
      }
    } catch (err) {
      showDialog('Error', 'Connection error loading users', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(users.filter(u => 
        u.email.toLowerCase().includes(query) ||
        (u.full_name && u.full_name.toLowerCase().includes(query)) ||
        (u.role && u.role.toLowerCase().includes(query)) ||
        (u.is_sysadmin && 'sysadmin'.includes(query))
      ))
    }
  }, [searchQuery, users])

  const handlePromote = async (user: User) => {
    showConfirm(
      'Promote to Sysadmin',
      `Are you sure you want to grant sysadmin privileges to ${user.full_name || user.email}?\n\nThis will give them full system access.`,
      async () => {
        setPromoting(user.id)
        try {
          const res = await fetch('/api/auth/promote-sysadmin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id })
          })

          const data = await res.json()
          if (res.ok) {
            showDialog('Success', 'User promoted to sysadmin successfully', 'success')
            // Update local state
            setUsers(prev => prev.map(u => 
              u.id === user.id ? { ...u, is_sysadmin: true } : u
            ))
          } else {
            showDialog('Error', data.error || 'Error promoting user', 'error')
          }
        } catch (err) {
          showDialog('Error', 'Connection error', 'error')
        } finally {
          setPromoting(null)
        }
      }
    )
  }

  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 sm:p-8">
        <div className="flex items-center justify-center py-8 sm:py-12">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-zinc-400" />
        <span className="ml-3 text-sm sm:text-base text-zinc-500 font-medium">Loading users...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <Dialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        actions={dialog.actions}
      />

      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate">Sysadmin Management</h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                {users.filter(u => u.is_sysadmin).length} sysadmins · {users.length} total users
              </p>
            </div>
          </div>
          <button
            onClick={fetchUsers}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="mt-3 sm:mt-4 relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 rounded-xl focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-bold"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[500px] sm:max-h-[600px] overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 font-medium">
              {searchQuery ? 'No users found' : 'No registered users'}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div 
              key={user.id}
              className="p-3 sm:p-4 lg:p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-zinc-400 to-zinc-600 flex items-center justify-center text-white font-bold shrink-0 text-sm sm:text-base">
                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
                    {user.full_name || 'No name'}
                  </p>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                    {!user.is_verified && (
                      <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Unverified
                      </span>
                    )}
                    {!user.is_active && (
                      <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                {user.is_sysadmin ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg sm:rounded-xl">
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs sm:text-sm font-bold text-purple-700 dark:text-purple-300">SYSADMIN</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handlePromote(user)}
                    disabled={promoting === user.id}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-zinc-700 dark:text-zinc-300 hover:text-purple-700 dark:hover:text-purple-300 rounded-lg sm:rounded-xl transition-all font-bold text-xs sm:text-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    {promoting === user.id ? (
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                      <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                    <span className="hidden sm:inline">Make Sysadmin</span>
                    <span className="sm:hidden">Promote</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
