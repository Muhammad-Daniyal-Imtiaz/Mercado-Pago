'use client'

import { useEffect, useState } from 'react'

interface Alert {
  id: string
  title: string
  message: string
  created_at: string
}

interface AlertListProps {
  limit?: number
}

export function AlertList({ limit }: AlertListProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/alerts')
      .then(res => res.json())
      .then(data => {
        setAlerts(limit ? data.slice(0, limit) : data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [limit])

  if (loading) return (<div className="p-4">Cargando las alertas...</div>)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Alertas recientes</h2>
        {/* lista de alertas */}
      </div>
    </div>
  )
}