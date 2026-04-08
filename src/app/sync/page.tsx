'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface UserDetails {
  email: string
  roles?: { role: string }[]
}

export default function SyncPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Sincronizando usuario...')
  const [details, setDetails] = useState<UserDetails | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function syncUser() {
      try {
        const res = await fetch('/api/auth/sync-user')
        const data = await res.json()

        if (res.ok) {
          setStatus('success')
          setMessage(data.message || 'Usuario sincronizado correctamente')
          setDetails(data.user)
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push('/dashboard/sysadmin')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Error al sincronizar')
          setDetails(data)
        }
      } catch (err: unknown) {
        setStatus('error')
        setMessage('Error de conexión: ' + (err instanceof Error ? err.message : String(err)))
      }
    }

    syncUser()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Sincronizando...</h1>
            <p className="text-zinc-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">¡Listo!</h1>
            <p className="text-zinc-400 mb-4">{message}</p>
            {details && (
              <div className="text-left text-sm text-zinc-500 bg-zinc-950 p-4 rounded-xl mb-4">
                <p><strong>Email:</strong> {details.email}</p>
                <p><strong>Rol:</strong> {details.roles?.[0]?.role || 'N/A'}</p>
              </div>
            )}
            <p className="text-zinc-600 text-sm">Redirigiendo al dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Error</h1>
            <p className="text-red-400 mb-4">{message}</p>
            {details && (
              <div className="text-left text-xs text-zinc-500 bg-zinc-950 p-4 rounded-xl mb-4 overflow-auto max-h-40">
                <pre>{JSON.stringify(details, null, 2)}</pre>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Reintentar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
