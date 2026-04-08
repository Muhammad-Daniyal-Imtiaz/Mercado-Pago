import RoleGuard from '@/components/auth/RoleGuard'
import { OrganizationForm } from '@/components/dashboard/OrganizationForm'
import InviteForm from '@/components/auth/InviteForm'
import { TeamsTable } from '@/components/dashboard/TeamsTable'
import { MPCredentialsForm } from '@/components/dashboard/MPCredentialsForm'

export default function AdminSettings() {
  return (
    <RoleGuard allowedRoles={['account_admin']}>
      <div className="p-8 space-y-8">
        {/* Sección de Mercado Pago */}
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-zinc-900 dark:text-white">Integraciones</h1>
          <p className="text-zinc-500 font-medium mt-2">Configura las credenciales de pago para tu equipo.</p>
          <div className="mt-6">
            <MPCredentialsForm />
          </div>
        </div>

        {/* Sección de Equipos */}
        <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <h1 className="text-4xl font-black tracking-tighter uppercase text-zinc-900 dark:text-white">Configuración de Equipos</h1>
          <p className="text-zinc-500 font-medium">Gestiona el perfil y la marca de los equipos.</p>
          <div className='space-y-6'>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Mis Equipos</h2>
            <TeamsTable />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <OrganizationForm />
              <InviteForm />
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
