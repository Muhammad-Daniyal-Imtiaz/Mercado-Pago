import RoleGuard from '@/components/auth/RoleGuard'

export default function UserSettings() {
  return (
    <RoleGuard allowedRoles={['account_user']}>
      <div className="p-8 space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Preferencias</h1>
        <p className="text-zinc-500 font-medium">Configure temas y alertas de notificación.</p>
      </div>
    </RoleGuard>
  )
}
