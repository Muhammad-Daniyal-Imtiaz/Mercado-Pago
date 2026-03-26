import RoleGuard from '@/components/auth/RoleGuard'
import { AlertList } from '@/components/alerts/AlertList'

export default function AlertsPage() {
  return (
    <RoleGuard allowedRoles={['sysadmin', 'account_admin', 'account_user', 'account_observer']}>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">System Alerts</h1>
        <AlertList />
      </div>
    </RoleGuard>
  )
}