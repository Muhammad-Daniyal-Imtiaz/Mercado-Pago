import RoleGuard from '@/components/auth/RoleGuard'

export default function NotificationsPage() {
  return (
    <RoleGuard allowedRoles={['sysadmin', 'account_admin', 'account_user', 'account_observer']}>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">Notifications</h1>
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-900 dark:text-white font-medium">Welcome to the dashboard!</p>
            <p className="text-sm text-zinc-500">Your account has been successfully set up.</p>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}