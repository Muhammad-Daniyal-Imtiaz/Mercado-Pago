import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { accountId } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Verificar que el usuario es sysadmin
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await adminClient
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
  }

  let userRoles = []
  try {
    userRoles = typeof profile.roles === 'string' ? JSON.parse(profile.roles) : (profile.roles || [])
  } catch {
    userRoles = []
  }

  const isSysadmin = userRoles.some((r: { role: string }) => r.role === 'sysadmin')
  if (!isSysadmin) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // 2. Obtener información de la cuenta y sus límites
  const { data: account } = await adminClient
    .from('accounts')
    .select('plan_limits, usage_stats')
    .eq('id', accountId)
    .single()

  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  // 3. Contar usuarios actuales en la organización
  const { data: organization } = await adminClient
    .from('organizations')
    .select('members')
    .eq('id', accountId)
    .single()

  let currentUsers = 0
  if (organization?.members) {
    currentUsers = organization.members.filter((member: any) => 
      member.status !== 'removed' && member.status !== 'inactive'
    ).length
  }

  // 4. Contar alertas activas (simulado - necesitarías implementar esto según tu estructura real)
  const currentAlerts = 0 // Implementar lógica real cuando tengas la tabla de alertas

  // 5. Contar llamadas API del mes actual (simulado)
  const currentApiCalls = 0 // Implementar lógica real cuando tengas tracking de API

  // 6. Calcular estadísticas
  const planLimits = account.plan_limits || {}
  const stats = {
    max_users: planLimits.max_users || 3,
    current_users: currentUsers,
    max_alerts: planLimits.max_alerts || 100,
    current_alerts: currentAlerts,
    api_calls_per_month: planLimits.api_calls_per_month || 1000,
    current_api_calls: currentApiCalls,
    usage_percentage: {
      users: planLimits.max_users === -1 ? 0 : (currentUsers / (planLimits.max_users || 1)) * 100,
      alerts: planLimits.max_alerts === -1 ? 0 : (currentAlerts / (planLimits.max_alerts || 1)) * 100,
      api_calls: planLimits.api_calls_per_month === -1 ? 0 : (currentApiCalls / (planLimits.api_calls_per_month || 1)) * 100
    }
  }

  return NextResponse.json({
    stats
  })
}
