import RoleGuard from '@/components/auth/RoleGuard'

export default function SysAdminAnalytics() {
  return (
    <RoleGuard allowedRoles={['sysadmin']}>
      <div className="p-8 space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Platform Analytics</h1>
        <p className="text-zinc-500 font-medium">Deep insights into system-wide performance and user behavior.</p>
        <div className="h-64 bg-zinc-100 dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
           <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Analytics Chart Placeholder</span>
        </div>
      </div>
    </RoleGuard>
  )
}
