import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function PUT(
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

  // 2. Actualizar la cuenta
  const updates = await request.json()

  // Si se cambia el plan, actualizar los límites
  if (updates.plan_type) {
    updates.plan_limits = getPlanLimits(updates.plan_type)
  }

  const { data: account, error: updateError } = await adminClient
    .from('accounts')
    .update(updates)
    .eq('id', accountId)
    .select()
    .single()

  if (updateError) {
    console.error('Error updating account:', updateError)
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    account
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Verificar que el usuario es sysadmin
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { accountId } = await params

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

  // 2. Eliminar la cuenta (soft delete)
  const { error: deleteError } = await adminClient
    .from('accounts')
    .update({ 
      billing_status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', accountId)

  if (deleteError) {
    console.error('Error deleting account:', deleteError)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Account cancelled successfully'
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
