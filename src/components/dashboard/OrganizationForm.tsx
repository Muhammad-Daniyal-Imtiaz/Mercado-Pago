'use client'

import { useState } from 'react'

export function OrganizationForm({ onSuccess }: { onSuccess?: () => void }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create organization')

      setMessage('Organization created successfully!')
      setName('')
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">Create New Organization</h2>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Organization Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="AlertFlow Business"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Organization'}
        </button>
        {message && <p className="text-green-600 font-bold text-center">{message}</p>}
        {error && <p className="text-red-500 font-medium text-center bg-red-50 dark:bg-red-900/10 p-2 rounded">{error}</p>}
      </form>
    </div>
  )
}
