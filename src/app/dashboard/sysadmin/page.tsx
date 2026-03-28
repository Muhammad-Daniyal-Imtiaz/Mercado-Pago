import RoleGuard from '@/components/auth/RoleGuard'
import { UserProfile } from '@/components/dashboard/UserProfile'
import { AlertList } from '@/components/alerts/AlertList'
import InviteForm from '@/components/auth/InviteForm'
import { OrganizationForm } from '@/components/dashboard/OrganizationForm'


export default function SysAdminDashboard() {
  return (
    <RoleGuard allowedRoles={['sysadmin']}>
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">
            SYSADMIN DASHBOARD
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
            System-wide administration and control panel.
          </p>
        </div>
        
        <UserProfile />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">System Alerts</h2>
            <AlertList limit={5} />
          </div>
          
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Infrastructure</h2>
            <OrganizationForm />
            <InviteForm />
          </div>

        </div>
      </div>
    </RoleGuard>
  )
}
