import RoleGuard from '@/components/auth/RoleGuard'

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={['sysadmin', 'account_admin']}>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">Settings</h1>
        <div className="max-w-2xl space-y-6">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Account Configuration</h2>
            <div className="space-y-4">
              <p className="text-zinc-500 dark:text-zinc-400">Manage your organization settings and preferences.</p>
              {/* Settings Form Placeholder */}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}