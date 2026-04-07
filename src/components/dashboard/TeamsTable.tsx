'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, Settings, Trash2, Eye, ChevronDown, ChevronRight, UserX, Send, Shield, User, UserCog, RotateCcw, Mail, Phone } from 'lucide-react'
import { Dialog, type DialogAction } from '@/components/alerts/Dialog'

interface Member {
  id: string
  email: string
  role: string
  full_name?: string
  joined_at?: string
  status?: 'active' | 'removed' | 'pending'
  removed_at?: string
  removed_by?: string
  restored_at?: string
  restored_by?: string
  phone?: string
}

interface Team {
  id: string
  name: string
  members?: Member[]
  created_at?: string
}

const ROLE_OPTIONS = [
  { value: 'account_admin', label: 'Administrador', icon: Shield },
  { value: 'account_user', label: 'Usuario', icon: User },
  { value: 'account_observer', label: 'Observador', icon: UserCog },
]

export function TeamsTable({ onRefresh }: { onRefresh?: () => void }) {
  const [teams, setTeams] = useState<Team[]>([])
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
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
      actions: [{ label: 'Aceptar', variant: 'primary', onClick: () => closeDialog() }],
    })
  }, [closeDialog])

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, confirmLabel = 'Confirmar') => {
    setDialog({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      actions: [
        { label: 'Cancelar', variant: 'ghost', onClick: closeDialog },
        { label: confirmLabel, variant: 'danger', onClick: () => { closeDialog(); onConfirm() } },
      ],
    })
  }, [closeDialog])

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/organizations/list')
      const data = await res.json()

      if (res.ok && data.organizations) {
        // Parse members JSON string if needed
        const parsedTeams = data.organizations.map((org: Team) => ({
          ...org,
          members: typeof org.members === 'string' ? JSON.parse(org.members) : (org.members || [])
        }))
        setTeams(parsedTeams)
      } else {
        setError(data.error || 'Error al cargar los equipos')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    showConfirm(
      'Eliminar Equipo',
      '¿Estás seguro de que deseas eliminar este equipo?',
      async () => {
        try {
          const res = await fetch(`/api/organizations/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ organization_id: teamId })
          })

          if (res.ok) {
            setTeams(teams.filter(t => t.id !== teamId))
            if (onRefresh) onRefresh()
          } else {
            const data = await res.json()
            showDialog('Error', data.error || 'Error al eliminar el equipo', 'error')
          }
        } catch (err) {
          showDialog('Error', 'Error de conexión al eliminar', 'error')
        }
      },
      'Eliminar'
    )
  }

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    showConfirm(
      'Desasociar Miembro',
      '¿Estás seguro de que deseas desasociar este miembro del equipo?',
      async () => {
        setActionLoading(`remove-${teamId}-${memberId}`)
        try {
          const res = await fetch('/api/organizations/members/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ organization_id: teamId, member_id: memberId })
          })

          if (res.ok) {
            setTeams(teams.map(t => {
              if (t.id === teamId) {
                return { ...t, members: t.members?.filter(m => m.id !== memberId) }
              }
              return t
            }))
          } else {
            const data = await res.json()
            showDialog('Error', data.error || 'Error al remover miembro', 'error')
          }
        } catch (err) {
          showDialog('Error', 'Error de conexión', 'error')
        } finally {
          setActionLoading(null)
        }
      },
      'Desasociar'
    )
  }

  const handleUpdateRole = async (teamId: string, memberId: string, newRole: string) => {
    setActionLoading(`role-${teamId}-${memberId}`)
    try {
      const res = await fetch('/api/organizations/members/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: teamId, member_id: memberId, new_role: newRole })
      })

      if (res.ok) {
        setTeams(teams.map(t => {
          if (t.id === teamId) {
            return {
              ...t,
              members: t.members?.map(m => m.id === memberId ? { ...m, role: newRole } : m)
            }
          }
          return t
        }))
      } else {
        const data = await res.json()
        showDialog('Error', data.error || 'Error al actualizar rol', 'error')
      }
    } catch (err) {
      showDialog('Error', 'Error de conexión', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResendInvite = async (teamId: string, memberEmail: string) => {
    setActionLoading(`resend-${teamId}-${memberEmail}`)
    try {
      const res = await fetch('/api/organizations/members/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: teamId, member_email: memberEmail })
      })

      if (res.ok) {
        showDialog('Éxito', 'Invitación reenviada exitosamente', 'success')
      } else {
        const data = await res.json()
        showDialog('Error', data.error || 'Error al reenviar invitación', 'error')
      }
    } catch (err) {
      showDialog('Error', 'Error de conexión', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestoreMember = async (teamId: string, memberId: string) => {
    showConfirm(
      'Restaurar Miembro',
      '¿Deseas restaurar este miembro al equipo?',
      async () => {
        setActionLoading(`restore-${teamId}-${memberId}`)
        try {
          const res = await fetch('/api/organizations/members/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ organization_id: teamId, member_id: memberId })
          })

          if (res.ok) {
            const data = await res.json()
            setTeams(teams.map(t => {
              if (t.id === teamId) {
                return {
                  ...t,
                  members: t.members?.map(m => m.id === memberId ? data.member : m)
                }
              }
              return t
            }))
            showDialog('Éxito', 'Miembro restaurado exitosamente', 'success')
          } else {
            const data = await res.json()
            showDialog('Error', data.error || 'Error al restaurar miembro', 'error')
          }
        } catch (err) {
          showDialog('Error', 'Error de conexión', 'error')
        } finally {
          setActionLoading(null)
        }
      },
      'Restaurar'
    )
  }

  const handleRecoverByEmail = async (teamId: string, email: string) => {
    // Find member by email and restore
    const team = teams.find(t => t.id === teamId)
    const member = team?.members?.find(m => m.email === email && m.status === 'removed')
    if (member) {
      await handleRestoreMember(teamId, member.id)
    } else {
      showDialog('Miembro no encontrado', 'No se encontró un miembro eliminado con ese email', 'error')
    }
  }

  const toggleExpand = (teamId: string) => {
    setExpandedTeam(expandedTeam === teamId ? null : teamId)
  }

  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
        <div className="space-y-4">
          <div className="w-full h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
          <div className="w-full h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
          <div className="w-full h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-zinc-900 dark:text-white" />
          <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Lista de Equipos</h3>
        </div>
        <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
          {teams.length} {teams.length === 1 ? 'equipo' : 'equipos'}
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border-b border-red-200 dark:border-red-900/30">
          <p className="text-red-600 dark:text-red-400 text-sm font-bold">{error}</p>
        </div>
      )}

      <Dialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        actions={dialog.actions}
      />

      {teams.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-2">No tienes equipos creados</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm">Crea tu primer equipo usando el formulario de abajo</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {teams.map((team) => (
            <div key={team.id} className="group">
              {/* Team Header */}
              <div 
                className="p-4 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                onClick={() => toggleExpand(team.id)}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <button className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    {expandedTeam === team.id ? (
                      <ChevronDown className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                    )}
                  </button>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm sm:text-base">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base">{team.name}</h4>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                      {team.members?.length || 0} {team.members?.length === 1 ? 'miembro' : 'miembros'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); window.location.href = `/dashboard/teams/${team.id}` }}
                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all"
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); window.location.href = `/dashboard/teams/${team.id}/settings` }}
                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-white transition-all"
                    title="Configuración"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id) }}
                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all"
                    title="Eliminar equipo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Members Section */}
              {expandedTeam === team.id && (
                <TeamMembersSection 
                  team={team} 
                  actionLoading={actionLoading}
                  onUpdateRole={handleUpdateRole}
                  onResendInvite={handleResendInvite}
                  onRemoveMember={handleRemoveMember}
                  onRestoreMember={handleRestoreMember}
                  onShowDialog={showDialog}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Sub-component for managing team members with tabs
function TeamMembersSection({ 
  team, 
  actionLoading,
  onUpdateRole,
  onResendInvite,
  onRemoveMember,
  onRestoreMember,
  onShowDialog,
}: { 
  team: Team
  actionLoading: string | null
  onUpdateRole: (teamId: string, memberId: string, role: string) => Promise<void>
  onResendInvite: (teamId: string, email: string) => Promise<void>
  onRemoveMember: (teamId: string, memberId: string) => Promise<void>
  onRestoreMember: (teamId: string, memberId: string) => Promise<void>
  onShowDialog: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
}) {
  const [activeTab, setActiveTab] = useState<'active' | 'removed'>('active')
  const [recoverEmail, setRecoverEmail] = useState('')
  const [showRecoverInput, setShowRecoverInput] = useState(false)

  const activeMembers = team.members?.filter(m => m.status !== 'removed') || []
  const removedMembers = team.members?.filter(m => m.status === 'removed') || []

  const handleRecoverByEmail = (e: React.FormEvent) => {
    e.preventDefault()
    const member = removedMembers.find(m => m.email === recoverEmail)
    if (member) {
      onRestoreMember(team.id, member.id)
      setRecoverEmail('')
      setShowRecoverInput(false)
    } else {
      onShowDialog('Miembro no encontrado', 'No se encontró un miembro eliminado con ese email', 'error')
    }
  }

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800">
      <div className="p-4 sm:p-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === 'active' 
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' 
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            Activos ({activeMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('removed')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === 'removed' 
                ? 'bg-red-600 text-white' 
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            Eliminados ({removedMembers.length})
          </button>
        </div>

        {/* Active Members */}
        {activeTab === 'active' && (
          <div className="space-y-2">
            {activeMembers.length > 0 ? (
              activeMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-zinc-400 to-zinc-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
                      {(member.full_name || member.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 dark:text-white text-sm truncate">
                        {member.full_name || member.email}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => onUpdateRole(team.id, member.id, e.target.value)}
                      disabled={actionLoading === `role-${team.id}-${member.id}`}
                      className="px-3 py-2 text-xs font-bold rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:border-zinc-900 dark:focus:border-white outline-none transition-all"
                    >
                      {ROLE_OPTIONS.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onResendInvite(team.id, member.email)}
                        disabled={actionLoading === `resend-${team.id}-${member.email}`}
                        className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400 transition-all disabled:opacity-50"
                        title="Reenviar invitación"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveMember(team.id, member.id)}
                        disabled={actionLoading === `remove-${team.id}-${member.id}`}
                        className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all disabled:opacity-50"
                        title="Desasociar miembro (soft-delete)"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                No hay miembros activos en este equipo
              </p>
            )}
          </div>
        )}

        {/* Removed Members */}
        {activeTab === 'removed' && (
          <div className="space-y-2">
            {/* Recover by Email */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-900/30">
              {!showRecoverInput ? (
                <button
                  onClick={() => setShowRecoverInput(true)}
                  className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Recuperar miembro por email
                </button>
              ) : (
                <form onSubmit={handleRecoverByEmail} className="flex gap-2">
                  <input
                    type="email"
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                    placeholder="Email del miembro eliminado"
                    className="flex-1 px-3 py-2 text-xs font-bold rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-zinc-900 focus:border-blue-500 outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 text-white text-xs font-black uppercase rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Recuperar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowRecoverInput(false); setRecoverEmail('') }}
                    className="px-3 py-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    Cancelar
                  </button>
                </form>
              )}
            </div>

            {removedMembers.length > 0 ? (
              removedMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0 opacity-50">
                      {(member.full_name || member.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 dark:text-white text-sm truncate opacity-60">
                        {member.full_name || member.email}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{member.email}</p>
                      <p className="text-[10px] text-red-500 dark:text-red-400 font-medium">
                        Eliminado: {member.removed_at ? new Date(member.removed_at).toLocaleDateString('es-ES') : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <span className="px-3 py-1 text-xs font-bold rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      {member.role}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onResendInvite(team.id, member.email)}
                        disabled={actionLoading === `resend-${team.id}-${member.email}`}
                        className="p-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400 transition-all disabled:opacity-50 border border-zinc-200 dark:border-zinc-700"
                        title="Reenviar invitación de vinculación"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRestoreMember(team.id, member.id)}
                        disabled={actionLoading === `restore-${team.id}-${member.id}`}
                        className="p-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all disabled:opacity-50 border border-zinc-200 dark:border-zinc-700"
                        title="Restaurar miembro"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                No hay miembros eliminados en este equipo
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
