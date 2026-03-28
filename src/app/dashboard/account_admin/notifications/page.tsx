import RoleGuard from '@/components/auth/RoleGuard'

export default function AdminNotifications() {
  return (
    <RoleGuard allowedRoles={['account_admin']}>
      <div className="p-8 space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Announcements</h1>
        <p className="text-zinc-500 font-medium">Broadcasts to your entire team.</p>
      </div>
    </RoleGuard>
  )
}
