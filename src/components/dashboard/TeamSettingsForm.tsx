'use client'

import { useEffect, useState } from 'react'
import { Settings, Users, Trash2, AlertTriangle, Save, X } from 'lucide-react'

interface TeamSettings {
  id: string
  name: string
  members?: Array<{
    id: string
    email: string
    role: string
    full_name?: string
  }>
  metadata?: Record<string, unknown>
  created_at?: string
}

export function TeamSettingsForm({ teamId }: { teamId: string }) {
  const [team, setTeam] = useState<TeamSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [name, setName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchTeam()
  }, [teamId])

  const fetchTeam = async () => {
    try {
      setLoading(true)
      setError('')
      
      const res = await fetch(`/api/organizations/get?id=${teamId}`)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        setError(errorData.error || `Error ${res.status}: ${res.statusText}`)
        setTeam(null)
        return
      }
      
      const data = await res.json()

      if (data.organization) {
        setTeam(data.organization)
        setName(data.organization.name)
      } else {
        setError('Equipo no encontrado')
        setTeam(null)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Error de red - verifica tu conexión')
      setTeam(null)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/organizations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: teamId, name: name.trim() })
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess('Nombre actualizado correctamente')
        setTeam(prev => prev ? { ...prev, name: name.trim() } : null)
      } else {
        setError(data.error || 'Error al actualizar')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este equipo? Esta acción no se puede deshacer.')) return

    try {
      const res = await fetch('/api/organizations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: teamId })
      })

      if (res.ok) {
        window.location.href = '/dashboard/account_admin/settings'
      } else {
        const data = await res.json()
        alert(data.error || 'Error al eliminar el equipo')
      }
    } catch (err) {
      alert('Error de conexión')
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
        <div className="space-y-4">
          <div className="w-full h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
          <div className="w-full h-32 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="w-full max-w-2xl bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/30 p-8">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300 font-bold">{error || 'Equipo no encontrado'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* General Settings */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-zinc-900 dark:text-white" />
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Información General</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm font-bold">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg">
            <p className="text-green-600 dark:text-green-400 text-sm font-bold">{success}</p>
          </div>
        )}

        <form onSubmit={handleUpdateName} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
              Nombre del Equipo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-bold"
              placeholder="Ej: Mi Negocio"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Creado: {team.created_at ? new Date(team.created_at).toLocaleDateString('es-ES') : 'N/A'}
            </p>
            <button
              type="submit"
              disabled={saving || name === team.name}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      {/* Team Stats */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-zinc-900 dark:text-white" />
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Estadísticas</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Miembros Totales</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{team.members?.length || 0}</p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">ID del Equipo</p>
            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate">{team.id}</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/30 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <h2 className="text-xl font-black text-red-700 dark:text-red-300 uppercase tracking-tight">Zona de Peligro</h2>
        </div>

        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
          Las siguientes acciones son irreversibles. Ten cuidado.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white font-black rounded-lg transition-all hover:bg-red-700 text-xs uppercase tracking-widest"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar Equipo
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-700 dark:text-red-300 font-bold">
              ¿Estás absolutamente seguro? Todos los datos del equipo se perderán.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteTeam}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-black rounded-lg transition-all hover:bg-red-700 text-xs uppercase tracking-widest"
              >
                <Trash2 className="w-4 h-4" />
                Sí, eliminar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black rounded-lg transition-all hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs uppercase tracking-widest"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
