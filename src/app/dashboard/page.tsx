import { UserProfile } from '@/components/dashboard/UserProfile'
import { AlertList } from '@/components/alerts/AlertList'
import RoleGuard from '@/components/auth/RoleGuard'
import InviteForm from '@/components/auth/InviteForm'

export default function DashboardPage() {
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">
          DASHBOARD
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
          Welcome back. Here's what's happening today.
        </p>
      </div>
      
      <RoleGuard allowedRoles={['sysadmin', 'account_admin', 'account_user', 'account_observer']}>
        <UserProfile />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AlertList limit={5} />
          
          <RoleGuard allowedRoles={['sysadmin', 'account_admin']}>
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                Team Management
              </h2>
              <InviteForm />
            </div>
          </RoleGuard>
        </div>
      </RoleGuard>
    </div>
  )
}
