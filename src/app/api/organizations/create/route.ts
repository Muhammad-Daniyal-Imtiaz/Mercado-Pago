import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { name } = await request.json()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('Org Create Auth Error:', authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Fetch user's profile to confirm role - use ADMIN client to bypass RLS
  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('roles, full_name')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    console.error('Org Create Admin Check Error:', userError)
    return NextResponse.json({
      error: 'User data not found for creator',
      details: userError?.message
    }, { status: 404 })
  }

  // Parse roles to check permissions
  let userRoles: Array<{
    organization_id: string
    role: string
    status?: string
    is_primary?: boolean
  }> = []
  
  try {
    userRoles = typeof userData.roles === 'string' 
      ? JSON.parse(userData.roles) 
      : (userData.roles || [])
  } catch (err) {
    userRoles = []
  }

  // Check if user has sysadmin role in any org or is creating first org
  const isSysadmin = userRoles.some(r => r.role === 'sysadmin')
  const hasAdminRole = userRoles.some(r => r.role === 'account_admin')
  
  if (!isSysadmin && !hasAdminRole && userRoles.length > 0) {
    console.warn(`User ${user.id} attempted to create organization without admin rights.`)
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Default role for creator in new organization
  const creatorRole = isSysadmin ? 'sysadmin' : 'account_admin'

  // 3. Create organization with initial member JSONB array
  const { data: orgData, error: orgError } = await adminClient
    .from('organizations')
    .insert({
      name,
      created_by: user.id,
      members: [
        {
          id: user.id,
          email: user.email,
          role: creatorRole,
          full_name: userData.full_name || user.email,
          status: 'active'
        }
      ]
    })
    .select()
    .single()

  if (orgError) {
    console.error('Org Insert Error:', orgError)
    return NextResponse.json({ error: orgError.message }, { status: 500 })
  }

  // 4. Add new organization to user's roles array with is_primary flag
  // Unset is_primary from all existing roles, then add new one with is_primary: true
  const updatedRoles = [
    ...userRoles.map(r => ({ ...r, is_primary: false })),
    {
      organization_id: orgData.id,
      role: creatorRole,
      status: 'active',
      is_primary: true
    }
  ]

  await adminClient
    .from('users')
    .update({ roles: updatedRoles })
    .eq('id', user.id)

  // 5. Si el creador es account_admin, crear automáticamente una cuenta vinculada
  if (creatorRole === 'account_admin') {
    // Generar slug único para la cuenta
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

    // Crear la cuenta con plan básico y 15 días de prueba
    const { error: accountError } = await adminClient
      .from('accounts')
      .insert({
        name: `${name} - Account`,
        slug,
        account_admin_id: orgData.id,
        plan_type: 'basic',
        billing_status: 'trial',
        payment_method: 'manual',
        current_balance: 0,
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        trial_ends_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        usage_stats: {},
        plan_limits: {
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
        billing_metadata: {}
      })

    if (accountError) {
      console.error('Account Creation Error:', accountError)
      // No fallar la creación de la organización si falla la cuenta
      console.warn('Organization created but account creation failed')
    }
  }

  return NextResponse.json({ success: true, organization: orgData })
}
