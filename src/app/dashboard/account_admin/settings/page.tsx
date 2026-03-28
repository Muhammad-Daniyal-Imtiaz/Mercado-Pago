import RoleGuard from '@/components/auth/RoleGuard'

export default function AdminSettings() {
  return (
    <RoleGuard allowedRoles={['account_admin']}>
      <div className="p-8 space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Org Settings</h1>
        <p className="text-zinc-500 font-medium">Manage organization profile and branding.</p>
      </div>
    </RoleGuard>
  )
}
