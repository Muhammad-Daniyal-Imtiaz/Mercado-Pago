import RoleGuard from '@/components/auth/RoleGuard'

export default function AdminAnalytics() {
  return (
    <RoleGuard allowedRoles={['account_admin']}>
      <div className="p-8 space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Team Analytics</h1>
        <p className="text-zinc-500 font-medium">Insights and business metrics for your organization.</p>
        <div className="h-64 bg-zinc-100 dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
           <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Org Stats Chart</span>
        </div>
      </div>
    </RoleGuard>
  )
}
