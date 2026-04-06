'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // NEW: State for Google Role Selection Window
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to sign in')
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignInConfirm = (selectedRole: string) => {
    setGoogleLoading(true)
    window.location.href = `/api/auth/google?role=${selectedRole}`
  }

  return (
    <div className="relative w-full max-w-md mx-auto p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">

      {/* Google Role Selection Modal Overlay */}
      {showRoleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <h2 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white uppercase tracking-tighter leading-none text-center">Tu rol</h2>
            <p className="text-zinc-500 text-sm mb-8 font-medium italic text-center">Si eres nuevo, selecciona tu rol antes de iniciar sesión con Google.</p>

            <div className="grid grid-cols-1 gap-4 mb-10">
              <button
                onClick={() => handleGoogleSignInConfirm('account_admin')}
                className="group p-6 text-left rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-white transition-all bg-zinc-50 dark:bg-zinc-950 shadow-sm"
              >
                <div className="font-black text-zinc-900 dark:text-white text-xl group-hover:translate-x-1 transition-transform uppercase">Administrador de cuenta</div>
                <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1 opacity-60">Business / Org Manager</div>
              </button>
              <button
                onClick={() => handleGoogleSignInConfirm('sysadmin')}
                className="group p-6 text-left rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-white transition-all bg-zinc-50 dark:bg-zinc-950 shadow-sm"
              >
                <div className="font-black text-zinc-900 dark:text-white text-xl group-hover:translate-x-1 transition-transform uppercase">Administrador del Sistema</div>
                <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1 opacity-60">Full Platform Access</div>
              </button>
              <button
                onClick={() => handleGoogleSignInConfirm('account_user')}
                className="group p-6 text-left rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-white transition-all bg-zinc-50 dark:bg-zinc-950 shadow-sm"
              >
                <div className="font-black text-zinc-900 dark:text-white text-xl group-hover:translate-x-1 transition-transform uppercase">Usuario Regular</div>
                <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1 opacity-60">Acceso Standard</div>
              </button>
            </div>

            <button
              onClick={() => setShowRoleModal(false)}
              className="w-full py-4 text-zinc-400 font-black uppercase tracking-widest text-xs hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="text-center mb-10">
        <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 uppercase">Bienvenido</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400 font-medium text-sm">Ingresa tus credenciales</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700/30 rounded-xl focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-bold"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Contraseña</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700/30 rounded-xl focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-bold"
            placeholder="Ingresa tu contraseña"
          />
        </div>

        {error && <div className="p-4 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black rounded-xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 uppercase tracking-widest"
        >
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div></div>
          <div className="relative flex justify-center text-xs font-black uppercase"><span className="px-4 bg-white dark:bg-zinc-900 text-zinc-400 tracking-widest">OAuth Seguro</span></div>
        </div>

        <button
          type="button"
          onClick={() => window.location.href = '/api/auth/google?role=account_user'}
          className="w-full py-4 bg-white dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-white font-black rounded-xl hover:border-zinc-900 dark:hover:border-white flex items-center justify-center gap-3 transition-all shadow-lg text-sm"
        >

          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {googleLoading ? 'Conectando...' : 'Cuenta de Google'}
        </button>
      </form>

      <p className="mt-8 text-center text-xs font-bold text-zinc-500">
        ¿Nuevo por aquí?{' '}
        <button onClick={() => router.push('/signup')} className="text-zinc-900 dark:text-zinc-100 hover:underline">Create Account</button>
      </p>
    </div>
  )
}