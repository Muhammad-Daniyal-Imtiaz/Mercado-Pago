import RoleGuard from '@/components/auth/RoleGuard'
import { UserProfile } from '@/components/dashboard/UserProfile'
import NotificationsPanel from '@/components/dashboard/mp/NotificationsPanel'


export default function AccountAdminDashboard() {
  return (
    <RoleGuard allowedRoles={['account_admin']}>
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <UserProfile />
        {/* ── Monitor de Pagos Mercado Pago ── */}
        <div className='space-y-6'>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Monitor de Pagos</h2>
          <NotificationsPanel />
        </div>
      </div>
    </RoleGuard>
  )
}
