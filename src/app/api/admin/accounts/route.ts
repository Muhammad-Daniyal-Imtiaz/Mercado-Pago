import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
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

  // 2. Obtener todas las cuentas con información de facturación
  const { data: accounts, error: accountsError } = await adminClient
    .from('accounts')
    .select(`
      *,
      organizations:account_admin_id (
        id,
        name,
        members
      )
    `)
    .order('created_at', { ascending: false })

  if (accountsError) {
    console.error('Error fetching accounts:', accountsError)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }

  // 3. Para cada cuenta, obtener el account_admin asociado
  const accountsWithAdmin = await Promise.all(
    accounts.map(async (account: any) => {
      // Buscar el account_admin de esta organización
      const orgAdmin = account.organizations?.members?.find((member: any) => member.role === 'account_admin')
      
      // Obtener información completa del account_admin
      let adminInfo = null
      if (orgAdmin?.id) {
        const { data: admin } = await adminClient
          .from('users')
          .select('id, email, full_name')
          .eq('id', orgAdmin.id)
          .single()
        adminInfo = admin
      }

      return {
        ...account,
        account_admin: adminInfo
      }
    })
  )

  return NextResponse.json({
    accounts: accountsWithAdmin
  })
}

export async function POST(request: Request) {
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

  // 2. Crear nueva cuenta
  const { name, plan_type = 'basic', account_admin_id } = await request.json()

  if (!name || !account_admin_id) {
    return NextResponse.json({ error: 'Name and account_admin_id are required' }, { status: 400 })
  }

  // 3. Generar slug único
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    const { data: existing } = await adminClient
      .from('accounts')
      .select('id')
      .eq('slug', slug)
      .single()
    
    if (!existing) break
    
    slug = `${baseSlug}-${counter}`
    counter++
  }

  // 4. Crear la cuenta
  const { data: account, error: createError } = await adminClient
    .from('accounts')
    .insert({
      name,
      slug,
      account_admin_id,
      plan_type,
      billing_status: 'trial',
      payment_method: 'manual',
      current_balance: 0,
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días desde hoy
      trial_ends_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 días de prueba
      usage_stats: {},
      plan_limits: getPlanLimits(plan_type),
      billing_metadata: {}
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating account:', createError)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    account
  })
}

function getPlanLimits(planType: string) {
  const limits = {
    basic: {
      max_users: 3,
      max_alerts: 100,
      max_integrations: 2,
      max_invitations: 5,
      api_calls_per_month: 1000,
      support_level: 'email',
      custom_branding: false,
      advanced_analytics: false,
      webhooks: false
    },
    professional: {
      max_users: 10,
      max_alerts: 1000,
      max_integrations: 10,
      max_invitations: 20,
      api_calls_per_month: 10000,
      support_level: 'priority',
      custom_branding: true,
      advanced_analytics: true,
      webhooks: true,
      sla_guarantee: true
    },
    enterprise: {
      max_users: -1,
      max_alerts: -1,
      max_integrations: -1,
      max_invitations: -1,
      api_calls_per_month: -1,
      support_level: '24/7',
      custom_branding: true,
      advanced_analytics: true,
      webhooks: true,
      sla_guarantee: true,
      dedicated_account_manager: true,
      custom_integrations: true
    }
  }
  
  return limits[planType as keyof typeof limits] || limits.basic
}
