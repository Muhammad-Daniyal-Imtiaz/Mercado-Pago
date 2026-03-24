'use client'

import { useEffect, useState } from 'react'

interface Alert {
  id: string
  title: string
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  created_at: string
}

interface AlertListProps {
  limit?: number
}

export function AlertList({ limit }: AlertListProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/alerts') // You'll need to implement this
      .then(res => res.json())
      .then(data => {
        setAlerts(limit ? data.slice(0, limit) : data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [limit])

  if (loading) return <div>Loading alerts...</div>

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Recent Alerts</h2>
      </div>
      <div className="divide-y">
        {alerts.length === 0 ? (
          <p className="p-4 text-gray-500">No alerts</p>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium">{alert.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${severityColor(alert.severity)}`}>
                  {alert.severity}
                </span>
              </div>
              <p className="text-sm text-gray-600">{alert.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}