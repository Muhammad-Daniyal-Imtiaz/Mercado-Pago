'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Eye, EyeOff, Save, CheckCircle, AlertCircle } from 'lucide-react'

export function MPCredentialsForm() {
  const [accessToken, setAccessToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasCredentials, setHasCredentials] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState<string | null>(null)
  const [availableOrgs, setAvailableOrgs] = useState<{id: string, name: string}[]>([])

  // Cargar estado actual al montar
  useEffect(() => {
    fetchCredentials()
  }, [])

  const fetchCredentials = async (showLoading = true, targetOrgId: string | null = null) => {
    if (showLoading) setLoading(true)
    try {
      const url = targetOrgId 
        ? `/api/organizations/credentials?organizationId=${targetOrgId}`
        : '/api/organizations/credentials'
        
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      
      if (res.ok) {
        setHasCredentials(data.hasCredentials)
        setOrganizationId(data.organizationId)
        setOrganizationName(data.organizationName)
        if (data.availableOrgs) setAvailableOrgs(data.availableOrgs)
        
        if (data.accessToken) {
          setAccessToken(data.accessToken)
        } else if (data.hasCredentials) {
          setAccessToken('••••••••••••••••••••••••')
        } else {
          setAccessToken('')
        }
      } else {
        if (data.availableOrgs) setAvailableOrgs(data.availableOrgs)
        setError(data.error)
      }
    } catch (err) {
      console.error('Error fetching credentials:', err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accessToken || accessToken === '••••••••••••••••••••••••') {
      setError('Por favor ingresa un nuevo token válido')
      return
    }

    if (!organizationId) {
      setError('No hay una organización seleccionada. Intenta refrescar la página.')
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const res = await fetch('/api/organizations/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, organizationId }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Error del servidor')
      }

      setMessage('¡Credenciales actualizadas correctamente!')
      setHasCredentials(true)
      setIsEditing(false)
      setShowToken(false)
      
      // Refresh in background to sync everything
      setTimeout(() => fetchCredentials(false, organizationId), 1000)
      
    } catch (err: any) {
      console.error('Submit Error:', err)
      if (err.name === 'AbortError') {
        setError('La solicitud tardó demasiado. Por favor verifica tu conexión.')
      } else {
        setError(err.message || 'Error inesperado al guardar')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = () => {
    setAccessToken('')
    setShowToken(true)
    setIsEditing(true)
  }

  return (
    <div className="w-full p-5 sm:p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
            Mercado Pago
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Configuración de integración
            </p>
            {organizationName && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700 mx-1">•</span>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {organizationName}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900 dark:border-white"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold uppercase tracking-wider ${
            hasCredentials 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
              : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
          }`}>
            {hasCredentials ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Credenciales configuradas
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                Credenciales pendientes
              </>
            )}
          </div>

          {availableOrgs.length > 1 && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
                Seleccionar Equipo / Organización
              </label>
              <select
                value={organizationId || ''}
                onChange={(e) => {
                  const newId = e.target.value
                  setMessage('')
                  setError('')
                  setIsEditing(false)
                  fetchCredentials(true, newId)
                }}
                className="w-full bg-white dark:bg-zinc-900 px-4 py-3 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 focus:border-blue-500 outline-none transition-all font-bold text-sm"
              >
                {availableOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
              Access Token de Mercado Pago
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="APP_USR-..."
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all font-mono text-sm disabled:opacity-70"
                disabled={hasCredentials && !isEditing}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
              El token debe comenzar con <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">APP_USR-</code> para producción o <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">TEST-</code> para pruebas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {hasCredentials && !isEditing ? (
              <button
                key="btn-update"
                type="button"
                onClick={handleEdit}
                className="flex-1 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Actualizar Token
              </button>
            ) : (
              <div key="edit-actions" className="flex flex-col sm:flex-row gap-3 flex-1">
                <button
                  key="btn-save"
                  type="submit"
                  disabled={saving || !accessToken}
                  className="flex-1 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar Credenciales'}
                </button>
                {(hasCredentials || isEditing) && (
                  <button
                    key="btn-cancel"
                    type="button"
                    onClick={async () => {
                      await fetchCredentials(true, organizationId)
                      setIsEditing(false)
                      setShowToken(false)
                      setError('')
                    }}
                    className="py-3 px-4 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl transition-all hover:border-zinc-400 dark:hover:border-zinc-500 uppercase tracking-widest text-xs"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </div>

          {message && (
            <p className="text-green-600 dark:text-green-400 font-bold text-center text-sm bg-green-50 dark:bg-green-900/10 p-3 rounded-xl">
              {message}
            </p>
          )}
          {error && (
            <p className="text-red-600 dark:text-red-400 font-bold text-center bg-red-50 dark:bg-red-900/10 p-3 rounded-xl text-sm">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
