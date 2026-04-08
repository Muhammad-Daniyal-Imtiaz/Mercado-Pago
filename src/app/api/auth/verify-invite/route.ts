import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { translateAuthError } from '@/lib/auth-errors'
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
    const newRole = { organization_id: invitation.organization_id, role: invitation.role }

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

  return NextResponse.json({ 
    success: true, 
    message: 'Registration complete' 
  })
}
