import RoleGuard from '@/components/auth/RoleGuard'
import { UserProfile } from '@/components/dashboard/UserProfile'

export default function AccountUserDashboard() {
  return (
    <RoleGuard allowedRoles={['account_user']}>
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <UserProfile />

      </div>
    </RoleGuard>
  )
}
