import { UserProfile } from '@/components/dashboard/UserProfile'
import { AlertList } from '@/components/alerts/AlertList'
import RoleGuard from '@/components/auth/RoleGuard'
import InviteForm from '@/components/auth/InviteForm'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <RoleGuard allowedRoles={['sysadmin', 'account_admin', 'account_user', 'account_observer']}>
        <UserProfile />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertList limit={5} />
          
          <RoleGuard allowedRoles={['sysadmin', 'account_admin']}>
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Team Management</h2>
              <InviteForm />
            </div>
          </RoleGuard>
        </div>
      </RoleGuard>
    </div>
  )
}