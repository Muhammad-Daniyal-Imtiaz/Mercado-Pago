'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Eye, EyeOff, Save, CheckCircle, AlertCircle } from 'lucide-react'

export function MPCredentialsForm() {
  const [accessToken, setAccessToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasCredentials, setHasCredentials] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Cargar estado actual al montar
  useEffect(() => {
    fetchCredentials()
  }, [])

  const fetchCredentials = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/organizations/credentials')
      const data = await res.json()
      
      if (res.ok) {
        setHasCredentials(data.hasCredentials)
        // Si tiene credenciales, mostrar placeholder
        if (data.hasCredentials) {
          setAccessToken('••••••••••••••••••••••••')
        }
      }
    } catch (err) {
      console.error('Error fetching credentials:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // No enviar si es el placeholder enmascarado
    if (accessToken === '••••••••••••••••••••••••') {
      setError('Por favor ingresa un nuevo token o cancela')
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/organizations/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      })

      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Error al guardar las credenciales')

      setMessage('Credenciales guardadas exitosamente')
      setHasCredentials(true)
      setAccessToken('••••••••••••••••••••••••')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = () => {
    setAccessToken('')
    setShowToken(true)
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
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Configuración de integración
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900 dark:border-white"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Estado de conexión */}
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

          {/* Campo del token */}
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
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all font-mono text-sm"
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

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3">
            {hasCredentials && accessToken === '••••••••••••••••••••••••' ? (
              <button
                type="button"
                onClick={handleEdit}
                className="flex-1 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Actualizar Token
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={saving || !accessToken}
                  className="flex-1 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar Credenciales'}
                </button>
                {hasCredentials && (
                  <button
                    type="button"
                    onClick={() => {
                      setAccessToken('••••••••••••••••••••••••')
                      setShowToken(false)
                      setError('')
                    }}
                    className="py-3 px-4 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl transition-all hover:border-zinc-400 dark:hover:border-zinc-500 uppercase tracking-widest text-xs"
                  >
                    Cancelar
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mensajes */}
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
