import RoleGuard from '@/components/auth/RoleGuard'
import { UserProfile } from '@/components/dashboard/UserProfile'
import InviteForm from '@/components/auth/InviteForm'
import { OrganizationForm } from '@/components/dashboard/OrganizationForm'

export default function AccountUserDashboard() {
  return (
    <RoleGuard allowedRoles={['account_user']}>
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <UserProfile />
        <div className='space-y-6'>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Mis Equipos</h2>
          <div className="grid grid-cols-2 gap-6">
            <OrganizationForm />
            <InviteForm />
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
