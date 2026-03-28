import RoleGuard from '@/components/auth/RoleGuard'

export default function ObserverAnalytics() {
  return (
    <RoleGuard allowedRoles={['account_observer']}>
      <div className="p-8 space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Observing Stats</h1>
        <p className="text-zinc-500 font-medium">Read-only access to system metrics.</p>
      </div>
    </RoleGuard>
  )
}
