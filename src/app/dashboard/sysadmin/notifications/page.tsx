import RoleGuard from '@/components/auth/RoleGuard'

export default function SysAdminNotifications() {
  return (
    <RoleGuard allowedRoles={['sysadmin']}>
      <div className="p-8 space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase">System Notifications</h1>
        <p className="text-zinc-500 font-medium">Broadcasts and system-level alerts sent to all users.</p>
      </div>
    </RoleGuard>
  )
}
