import RoleGuard from '@/components/auth/RoleGuard'
import { UserProfile } from '@/components/dashboard/UserProfile'
import InviteForm from '@/components/auth/InviteForm'
import { OrganizationForm } from '@/components/dashboard/OrganizationForm'


export default function SysAdminDashboard() {
  return (
    <RoleGuard allowedRoles={['sysadmin']}>
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <UserProfile />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Infrastructure</h2>
            <OrganizationForm />
            <InviteForm />
          </div>

        </div>
      </div>
    </RoleGuard>
  )
}
