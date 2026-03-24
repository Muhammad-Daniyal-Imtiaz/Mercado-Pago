'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setVerified(true)
          } else {
            setError(data.error || 'Verification failed')
          }
        })
        .catch(() => setError('Verification failed'))
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center">
        {verified ? (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Email Verified!</h2>
            <p className="mb-4">Your email has been successfully verified.</p>
            <Link href="/login" className="text-blue-600 hover:underline">
              Proceed to login
            </Link>
          </>
        ) : error ? (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h2>
            <p className="mb-4">{error}</p>
            <Link href="/login" className="text-blue-600 hover:underline">
              Back to login
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Check your email</h2>
            <p className="mb-4">
              We've sent a verification link to <strong>{email}</strong>.
              Please click the link to verify your email.
            </p>
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or{' '}
              <button className="text-blue-600 hover:underline">resend</button>.
            </p>
          </>
        )}
      </div>
    </div>
  )
}