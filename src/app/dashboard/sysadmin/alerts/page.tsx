import RoleGuard from '@/components/auth/RoleGuard'
import { AlertList } from '@/components/alerts/AlertList'

export default function SysAdminAlerts() {
  return (
    <RoleGuard allowedRoles={['sysadmin']}>
      <div className="p-8 space-y-6">
        <h1 className="text-4xl font-black tracking-tighter uppercase">System-Wide Alerts</h1>
        <AlertList />
      </div>
    </RoleGuard>
  )
}
