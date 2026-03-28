import RoleGuard from '@/components/auth/RoleGuard'
import { AlertList } from '@/components/alerts/AlertList'

export default function ObserverAlerts() {
  return (
    <RoleGuard allowedRoles={['account_observer']}>
      <div className="p-8 space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Monitoring Feed</h1>
        <AlertList />
      </div>
    </RoleGuard>
  )
}
