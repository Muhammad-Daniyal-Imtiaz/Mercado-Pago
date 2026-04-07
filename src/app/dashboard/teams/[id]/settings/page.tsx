import RoleGuard from '@/components/auth/RoleGuard'
import { TeamSettingsForm } from '@/components/dashboard/TeamSettingsForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TeamSettingsPage({ params }: PageProps) {
  const { id } = await params

  return (
    <RoleGuard allowedRoles={['account_admin', 'sysadmin']}>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Configuración del Equipo</h1>
          <p className="text-zinc-500 font-medium mt-2">Gestiona los detalles y preferencias de tu equipo.</p>
        </div>
        
        <TeamSettingsForm teamId={id} />
      </div>
    </RoleGuard>
  )
}
