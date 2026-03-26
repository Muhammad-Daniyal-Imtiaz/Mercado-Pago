import RoleGuard from '@/components/auth/RoleGuard'

export default function AnalyticsPage() {
  return (
    <RoleGuard allowedRoles={['sysadmin', 'account_admin']}>
      <div className="p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Analytics</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Real-time system monitoring and usage metrics.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Total Notifications</p>
            <p className="text-5xl font-black text-zinc-900 dark:text-white">1,284</p>
          </div>
          <div className="p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Active Users</p>
            <p className="text-5xl font-black text-zinc-900 dark:text-white">42</p>
          </div>
          <div className="p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">System Uptime</p>
            <p className="text-5xl font-black text-green-600">99.9%</p>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}

