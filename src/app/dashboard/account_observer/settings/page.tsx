import RoleGuard from '@/components/auth/RoleGuard'

export default function ObserverSettings() {
  return (
    <RoleGuard allowedRoles={['account_observer']}>
      <div className="p-8 space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Preferences</h1>
        <p className="text-zinc-500 font-medium">Manage how you view the platform.</p>
      </div>
    </RoleGuard>
  )
}
