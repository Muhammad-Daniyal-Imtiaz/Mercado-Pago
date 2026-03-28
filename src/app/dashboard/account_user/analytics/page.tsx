import RoleGuard from '@/components/auth/RoleGuard'

export default function UserAnalytics() {
  return (
    <RoleGuard allowedRoles={['account_user']}>
      <div className="p-8 space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Activity Insights</h1>
        <p className="text-zinc-500 font-medium">Viewing your personal engagement metrics.</p>
        <div className="h-48 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center italic text-zinc-400">
           Quick stats summary
        </div>
      </div>
    </RoleGuard>
  )
}
