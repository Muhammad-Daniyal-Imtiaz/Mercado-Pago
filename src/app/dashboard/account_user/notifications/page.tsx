import RoleGuard from '@/components/auth/RoleGuard'

export default function UserNotifications() {
  return (
    <RoleGuard allowedRoles={['account_user']}>
      <div className="p-8 space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase">My Mailbox</h1>
        <p className="text-zinc-500 font-medium">Direct messages and mentions.</p>
      </div>
    </RoleGuard>
  )
}
