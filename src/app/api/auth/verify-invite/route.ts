import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { translateAuthError } from '@/lib/auth-errors'
import { syncUserRoles } from '@/lib/role-sync'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, otp, password, fullName } = await request.json()

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Check invitation
  const { data: invitation, error: inviteError } = await adminClient
    .from('invitations')
    .select('*')
    .eq('email', email)
    .eq('token', otp)
    .single()

  if (inviteError || !invitation) {
    return NextResponse.json({ error: 'Invalid invitation email or OTP' }, { status: 400 })
  }

  // 2. Check expiry
  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
  }

  let authData: { user?: any } = {}
  let authError: Error | null = null

  // 3. Handle authentication
  if (request.headers.get('x-provider') === 'google') {
    // Google user - update profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    // Get existing user roles
    const { data: profile } = await adminClient.from('users').select('roles').eq('id', user.id).single()
    const currentRoles = profile?.roles || []
    const newRole = { organization_id: invitation.organization_id, role: invitation.role, status: 'active', is_primary: currentRoles.length === 0 }

    // Append new role to the array
    const updatedRoles = [...currentRoles.filter((r: { organization_id: string }) => r.organization_id !== invitation.organization_id), newRole]

    const { error: updateError } = await adminClient
      .from('users')
      .update({
        roles: updatedRoles,
        full_name: fullName || user.user_metadata?.full_name
      })
      .eq('id', user.id)

    authData = { user }
    authError = updateError
  } else {
    // Email/Password signup
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: invitation.role,
          organization_id: invitation.organization_id,
          full_name: fullName,
        },
      },
    })
    
    authData = result.data
    authError = result.error
    
    // If auth was successful, create user profile
    if (!authError && authData.user) {
      const userRoles = [{
        organization_id: invitation.organization_id,
        role: invitation.role,
        status: 'active',
        is_primary: true
      }]
      
      const { error: profileError } = await adminClient
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          roles: userRoles,
          is_active: true,
          is_verified: true,
          email_confirmed_at: new Date().toISOString(),
          notification_preferences: {
            sms: false,
            push: true,
            email: true,
            digest: 'instant'
          },
          alert_channels: {
            low: ['email'],
            high: ['email', 'push'],
            medium: ['email'],
            critical: ['email', 'push', 'sms']
          },
          metadata: {}
        })
        
      if (profileError) {
        console.error('Error creating user profile:', profileError)
        authError = profileError
      }
    }
  }

  if (authError) {
    const errorMessage = 'message' in authError 
      ? translateAuthError(authError.message) 
      : 'Error de autenticación'
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }

  // 4. Update Organization Members
  if (invitation.organization_id) {
    const { data: org } = await adminClient
      .from('organizations')
      .select('members')
      .eq('id', invitation.organization_id)
      .single()
      
    const currentMembers = org?.members || []
    const newMember = {
      id: authData.user?.id || 'pending',
      email: email,
      role: invitation.role,
      joined_at: new Date().toISOString()
    }

    if (!currentMembers.some((m: { email: string }) => m.email === email)) {
      await adminClient
        .from('organizations')
        .update({ members: [...currentMembers, newMember] })
        .eq('id', invitation.organization_id)
    }
  }

  // 5. Delete invitation
  await adminClient.from('invitations').delete().eq('id', invitation.id)

  // 6. Create account for account_admin users
  if (invitation.role === 'account_admin' && authData.user?.id) {
    try {
      const orgName = invitation.organization_id ? 
        (await adminClient.from('organizations').select('name').eq('id', invitation.organization_id).single())?.data?.name || 
        'Default Organization' : 
        'Default Organization'
      
      // Generar slug único para la cuenta
      const baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
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
          name: `${orgName} - Account`,
          slug,
          account_admin_id: invitation.organization_id,
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
        // No fallar la verificación si falla la cuenta
        console.warn('Invitation verified but account creation failed')
      } else {
        console.log('Account created successfully for account_admin:', email)
      }
    } catch (accountErr) {
      console.error('Error creating account for account_admin:', accountErr)
      // No fallar la verificación si falla la cuenta
    }
  }

  // 7. Sync roles to ensure consistency
  if (authData.user?.id) {
    try {
      await syncUserRoles(authData.user.id)
    } catch (syncError) {
      console.error('Error syncing roles after invitation:', syncError)
      // Don't fail the request, but log the error
    }
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Registration complete' 
  })
}
