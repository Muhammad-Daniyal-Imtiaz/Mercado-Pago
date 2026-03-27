import RoleGuard from '@/components/auth/RoleGuard'
import { UserProfile } from '@/components/dashboard/UserProfile'
import { AlertList } from '@/components/alerts/AlertList'
import InviteForm from '@/components/auth/InviteForm'

export default function AccountAdminDashboard() {
  return (
    <RoleGuard allowedRoles={['account_admin']}>
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">
            ADMIN DASHBOARD
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
            Manage your organization and team members.
          </p>
        </div>
        
        <UserProfile />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Team Alerts</h2>
            <AlertList limit={5} />
          </div>
          
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Invite Members</h2>
            <InviteForm />
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
