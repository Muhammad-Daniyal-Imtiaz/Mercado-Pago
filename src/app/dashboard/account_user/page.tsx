import RoleGuard from '@/components/auth/RoleGuard'
import { UserProfile } from '@/components/dashboard/UserProfile'
import { AlertList } from '@/components/alerts/AlertList'

export default function AccountUserDashboard() {
  return (
    <RoleGuard allowedRoles={['account_user']}>
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <UserProfile />
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Últimas alertas</h2>
          <AlertList limit={10} />
        </div>
      </div>
    </RoleGuard>
  )
}
