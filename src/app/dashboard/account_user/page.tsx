import RoleGuard from '@/components/auth/RoleGuard'
import { UserProfile } from '@/components/dashboard/UserProfile'
import { AlertList } from '@/components/alerts/AlertList'

export default function AccountUserDashboard() {
  return (
    <RoleGuard allowedRoles={['account_user']}>
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">
            USER DASHBOARD
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
            View your alerts and manage your notifications.
          </p>
        </div>
        
        <UserProfile />
        
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Your Alerts</h2>
          <AlertList limit={10} />
        </div>
      </div>
    </RoleGuard>
  )
}
