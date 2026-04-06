'use client'

import { useState, useEffect } from 'react'

export default function InviteForm() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('account_user')
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingOrgs, setFetchingOrgs] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const res = await fetch('/api/organizations/list')
        const data = await res.json()
        if (data.organizations) {
          setOrganizations(data.organizations)
          if (data.organizations.length > 0) {
            setSelectedOrg(data.organizations[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to fetch orgs:', err)
      } finally {
        setFetchingOrgs(false)
      }
    }
    fetchOrganizations()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrg) {
      setError('Please select an organization first.')
      return
    }

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, organization_id: selectedOrg }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send invitation')

      setMessage('Invitation sent successfully!')
      setEmail('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetchingOrgs) return <div className="text-center p-6 text-zinc-500 font-medium">Loading organizations...</div>

  if (organizations.length === 0) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-4">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-tighter">No Organizations Found</h3>
        <p className="text-zinc-500 text-sm">You must create at least one organization before you can invite team members.</p>
      </div>
    )
  }

  return (
    <div className="w-full p-5 sm:p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all">
      <h2 className="text-2xl sm:text-3xl font-black mb-6 text-zinc-900 dark:text-white tracking-tighter uppercase">Invitar usuario</h2>
      <form onSubmit={handleInvite} className="space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
            Email de destino
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-bold placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
            placeholder="colleague@business.com"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
              Rol
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none transition-all font-bold appearance-none cursor-pointer"
            >
              <option value="account_user">User</option>
              <option value="account_observer">Observer</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
              Organización
            </label>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none transition-all font-bold appearance-none cursor-pointer"
            >
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 transition-all uppercase tracking-widest"
        >
          {loading ? 'Processing...' : 'Send Invitation'}
        </button>
        {message && <p className="text-green-600 font-bold text-center animate-pulse">{message}</p>}
        {error && <p className="text-red-500 font-medium text-center bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</p>}
      </form>
    </div>
  )
}