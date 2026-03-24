'use client'

import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setPreferences(data.user.notificationPreferences)
        }
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
        <pre>{JSON.stringify(preferences, null, 2)}</pre>
      </div>
    </div>
  )
}