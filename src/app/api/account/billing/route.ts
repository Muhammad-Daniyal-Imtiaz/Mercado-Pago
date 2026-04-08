import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Verificar que el usuario está autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Obtener roles del usuario
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

  // 3. Verificar que es account_admin
  const accountAdminRole = userRoles.find((r: { role: string }) => r.role === 'account_admin')
  if (!accountAdminRole) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // 4. Obtener la cuenta asociada al account_admin
  const { data: account, error: accountError } = await adminClient
    .from('accounts')
    .select('*')
    .eq('account_admin_id', accountAdminRole.organization_id)
    .single()

  if (accountError || !account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  // 5. Obtener estadísticas de uso
  const { data: organization } = await adminClient
    .from('organizations')
    .select('members')
    .eq('id', accountAdminRole.organization_id)
    .single()

  let currentUsers = 0
  if (organization?.members) {
    currentUsers = organization.members.filter((member: any) => 
      member.status !== 'removed' && member.status !== 'inactive'
    ).length
  }

  // 6. Contar alertas activas (simulado - implementar cuando tengas la tabla)
  const currentAlerts = 0

  // 7. Contar llamadas API del mes actual (simulado)
  const currentApiCalls = 0

  // 8. Calcular estadísticas
  const planLimits = account.plan_limits || {}
  const usage = {
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
    account,
    usage
  })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Verificar que el usuario está autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Obtener roles del usuario
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

  // 3. Verificar que es account_admin
  const accountAdminRole = userRoles.find((r: { role: string }) => r.role === 'account_admin')
  if (!accountAdminRole) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // 4. Obtener la cuenta asociada
  const { data: account } = await adminClient
    .from('accounts')
    .select('id')
    .eq('account_admin_id', accountAdminRole.organization_id)
    .single()

  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  // 5. Actualizar datos permitidos del account_admin
  const updates = await request.json()
  const allowedUpdates = ['billing_email', 'billing_address', 'billing_phone', 'tax_id']
  const filteredUpdates: any = {}

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key]
    }
  }

  // Encriptar datos sensibles
  if (filteredUpdates.billing_address) {
    // Aquí podrías encriptar datos sensibles si es necesario
    // Por ahora los guardamos como están
  }

  const { data: updatedAccount, error: updateError } = await adminClient
    .from('accounts')
    .update(filteredUpdates)
    .eq('id', account.id)
    .select()
    .single()

  if (updateError) {
    console.error('Error updating account:', updateError)
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    account: updatedAccount
  })
}
