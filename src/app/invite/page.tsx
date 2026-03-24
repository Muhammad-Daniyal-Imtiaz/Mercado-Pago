'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SignupForm } from '@/components/auth/SignupForm'

export default function InvitePage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [valid, setValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (!token) {
      setValid(false)
      return
    }
    // Optionally validate token with backend before showing form
    fetch(`/api/auth/validate-invite?token=${token}`)
      .then(res => res.json())
      .then(data => setValid(data.valid))
      .catch(() => setValid(false))
  }, [token])

  if (valid === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid or Expired Invitation</h2>
          <p className="mb-4">The invitation link you used is invalid or has expired.</p>
          <p>Please contact your administrator for a new invitation.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Complete your registration</h2>
          <p className="text-center text-gray-600 mt-2">You've been invited to join</p>
        </div>
        <SignupForm invitationToken={token} />
      </div>
    </div>
  )
}