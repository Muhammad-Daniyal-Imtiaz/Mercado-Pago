'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'

export function OrganizationFormEn({ onSuccess }: { onSuccess?: () => void }) {
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
      if (!res.ok) throw new Error(data.error || 'Error creating organization')

      setMessage('Organization created successfully!')
      setName('')
      
      // Emit event to update other components
      window.dispatchEvent(new CustomEvent('org-created', { 
        detail: { organization: data.organization } 
      }))
      
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full p-5 sm:p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 transition-colors">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mb-4 sm:mb-6 text-zinc-900 dark:text-white uppercase tracking-tight"><Users className="inline-block w-6 h-6 sm:w-8 sm:h-8 mr-2" /> Create Team</h2>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
            Team Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-bold"
            placeholder="Ex: My Business"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-xs"
        >
          {loading ? 'Creating...' : 'Create Team'}
        </button>
        {message && <p className="text-green-500 font-bold text-center text-sm">{message}</p>}
        {error && <p className="text-red-500 font-bold text-center bg-red-50 dark:bg-red-900/10 p-2 rounded text-sm">{error}</p>}
      </form>
    </div>
  )
}
