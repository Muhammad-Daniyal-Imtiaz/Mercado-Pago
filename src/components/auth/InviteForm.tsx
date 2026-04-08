'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from 'lucide-react'

export default function InviteForm() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('account_user')
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingOrgs, setFetchingOrgs] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch('/api/organizations/list')
      const data = await res.json()
      if (data.organizations) {
        setOrganizations(data.organizations)
        if (data.organizations.length > 0 && !selectedOrg) {
          setSelectedOrg(data.organizations[0].id)
        }
      }
    } catch (err) {
      console.error('Error al cargar organizaciones:', err)
    } finally {
      setFetchingOrgs(false)
    }
  }, [selectedOrg])

  useEffect(() => {
    fetchOrganizations()

    // Listener for new organization creation event from sibling component
    const handleOrgCreated = () => {
      fetchOrganizations()
    }

    window.addEventListener('org-created', handleOrgCreated)
    return () => window.removeEventListener('org-created', handleOrgCreated)
  }, [fetchOrganizations])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrg) {
      setError('Por favor, selecciona una organización primero.')
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
      if (!res.ok) throw new Error(data.error || 'Error al enviar la invitación')

      setMessage('¡Invitación enviada con éxito!')
      setEmail('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetchingOrgs) {
    return (
      <div className="w-full flex items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 dark:border-t-white rounded-full animate-spin"></div>
          <span className="text-sm font-black uppercase tracking-widest text-zinc-400">Cargando equipos...</span>
        </div>
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div className="w-full p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-4 flex flex-col justify-center min-h-[300px]">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tighter uppercase">No se encontraron equipos</h3>
        <p className="text-zinc-500 text-sm max-w-xs mx-auto">
          Debes crear al menos un equipo antes de poder invitar a nuevos miembros.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full p-5 sm:p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all">
      <h2 className="text-2xl sm:text-3xl font-black mb-6 text-zinc-900 dark:text-white tracking-tighter uppercase"><User className="inline-block w-8 h-8 mr-2" /> Invitar usuario</h2>
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
            placeholder="colega@nombre-negocio.com"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
              Rol
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none transition-all font-bold appearance-none cursor-pointer"
              >
                <option value="account_user">Usuario</option>
                <option value="account_admin">Administrador</option>
                <option value="account_observer">Observador</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                ↓
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
              Equipo
            </label>
            <div className="relative">
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none transition-all font-bold appearance-none cursor-pointer"
              >
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                ↓
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 transition-all uppercase tracking-widest text-xs"
        >
          {loading ? 'Enviando...' : 'Enviar Invitación'}
        </button>
        {message && <p className="text-green-600 font-bold text-center animate-pulse text-sm">{message}</p>}
        {error && <p className="text-red-500 font-bold text-center bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-200 dark:border-red-800 text-sm">{error}</p>}
      </form>
    </div>
  )
}