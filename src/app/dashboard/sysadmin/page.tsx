import RoleGuard from '@/components/auth/RoleGuard'
import { UserProfile } from '@/components/dashboard/UserProfile'
import InviteFormEn from '@/components/auth/InviteFormEn'
import { OrganizationFormEn } from '@/components/dashboard/OrganizationFormEn'
import { SysadminManager } from '@/components/dashboard/SysadminManager'


export default function SysAdminDashboard() {
  return (
    <RoleGuard allowedRoles={['sysadmin']}>
      <div className="space-y-6 sm:space-y-8 p-3 sm:p-4 lg:p-6 xl:p-8">
        <UserProfile />

        {/* Sysadmin Management Section */}
        <div className='space-y-4 sm:space-y-6'>
          <SysadminManager />
        </div>

        <div className='space-y-4 sm:space-y-6'>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">My Teams</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <OrganizationFormEn />
            <InviteFormEn />
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
