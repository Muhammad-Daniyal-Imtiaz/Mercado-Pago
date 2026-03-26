import RoleGuard from '@/components/auth/RoleGuard'
import InviteForm from '@/components/auth/InviteForm'

export default function UsersPage() {
  return (
    <RoleGuard allowedRoles={['sysadmin', 'account_admin']}>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">User Management</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Invite Team Members</h2>
            <InviteForm />
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Pending Invitations</h2>
            <p className="text-zinc-500 dark:text-zinc-400">No pending invitations currently.</p>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}