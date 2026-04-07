import RoleGuard from '@/components/auth/RoleGuard'
import { OrganizationForm } from '@/components/dashboard/OrganizationForm'
import InviteForm from '@/components/auth/InviteForm'


export default function AdminSettings() {
  return (
    <RoleGuard allowedRoles={['account_admin']}>
      <div className="p-8 space-y-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Org Settings</h1>
        <p className="text-zinc-500 font-medium">Manage organization profile and branding.</p>
        <div className='space-y-6'>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Mis Equipos</h2>
          <div className="grid grid-cols-2 gap-6">
            <OrganizationForm />
            <InviteForm />
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
