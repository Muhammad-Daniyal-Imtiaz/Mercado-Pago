'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function UnifiedVerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Detect if arrived from Google OAuth flow
  const providerParam = searchParams.get('provider') || 'email'
  const emailParam = searchParams.get('email') || ''
  const isGoogle = providerParam === 'google'

  const [formData, setFormData] = useState({
    email: emailParam,
    fullName: '',
    otp: '',
    password: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Pre-fill email if passed in URL
  useEffect(() => {
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }))
    }
  }, [emailParam])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/auth/verify-invite', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-provider': providerParam // Tell the API if this is a Google completion
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to verify invitation')

      setMessage('Success! Redirecting you now...')
      
      setTimeout(() => {
        // If Google, they already have a session, go to dashboard
        // If Email, they need to login (or API could auto-login, but for now /login is safer)
        router.push(isGoogle ? '/dashboard' : '/login')
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full p-10 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 transition-all scale-animation">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-highlight">
          <svg className="w-8 h-8 text-zinc-900 dark:text-zinc-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none mb-3">
          {isGoogle ? 'Verify Access' : 'Join Team'}
        </h1>
        <p className="text-zinc-500 font-medium text-sm leading-relaxed px-4 italic">
          {isGoogle 
            ? 'Complete your account setup by entering the OTP code sent to your email.'
            : 'Enter your invitation code and set up your profile to continue.'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {!isGoogle && (
          <div className="space-y-4 mb-8">
            <button
              type="button"
              onClick={() => router.push('/api/auth/google')}
              className="w-full py-4 flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span className="font-bold text-zinc-900 dark:text-white">Continue with Google</span>
            </button>
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Or continue with email</span>
              <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
            </div>
          </div>
        )}

        <div className="space-y-4">

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 px-1">Email Address</label>
            <input
              name="email"
              type="email"
              required
              readOnly={!!emailParam}
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-5 py-4 rounded-2xl border-2 transition-all font-bold ${emailParam ? 'bg-zinc-100 dark:bg-zinc-800/50 border-transparent text-zinc-400 cursor-not-allowed' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-white outline-none'}`}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 px-1">Verification OTP</label>
            <input
              name="otp"
              type="text"
              required
              maxLength={6}
              value={formData.otp}
              onChange={handleChange}
              className="w-full px-5 py-5 rounded-2xl border-2 bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-white outline-none transition-all tracking-[0.6em] text-center text-3xl font-black text-zinc-900 dark:text-white"
              placeholder="000000"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 px-1">Full Name</label>
            <input
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-5 py-4 rounded-2xl border-2 bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-bold"
              placeholder="How should we call you?"
            />
          </div>

          {!isGoogle && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 px-1">Set Password</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-5 py-4 rounded-2xl border-2 bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-bold"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black rounded-3xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl disabled:opacity-50 uppercase tracking-[0.15em] text-xs"
        >
          {loading ? 'Validating...' : 'Complete Profile'}
        </button>
        
        {message && <div className="p-4 text-xs font-bold text-center text-green-600 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-800 animate-pulse">{message}</div>}
        {error && <div className="p-4 text-xs font-bold text-center text-red-600 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800">{error}</div>}
      </form>
    </div>
  )
}

export default function UnifiedVerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-100 dark:bg-black overflow-hidden relative">
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <Suspense fallback={<div className="font-black italic uppercase text-zinc-300 animate-pulse">Syncing...</div>}>
        <UnifiedVerifyForm />
      </Suspense>
    </div>
  )
}