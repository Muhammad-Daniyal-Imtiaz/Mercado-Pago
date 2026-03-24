import { AlertList } from '@/components/alerts/AlertList'

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Alerts</h1>
      <AlertList />
    </div>
  )
}