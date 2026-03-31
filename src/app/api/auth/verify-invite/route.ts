import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
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

  const { data: authData, error: authError } = await (async () => {
    // If user is already authenticated with Google, we just update their profile
    if (request.headers.get('x-provider') === 'google') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: null, error: { message: 'Authentication required' } }
      
      // Get existing user roles
      const { data: profile } = await adminClient.from('users').select('roles').eq('id', user.id).single()
      const currentRoles = profile?.roles || []
      const newRole = { organization_id: invitation.organization_id, role: invitation.role }

      // Append new role to the array (don't overwrite!)
      const updatedRoles = [...currentRoles.filter((r: { organization_id: string }) => r.organization_id !== invitation.organization_id), newRole]

      const { error: updateError } = await adminClient
        .from('users')
        .update({
          roles: updatedRoles,
          role: invitation.role, // Set as active role for now
          organization_id: invitation.organization_id, // Set as active organization for now
          full_name: fullName || user.user_metadata?.full_name
        })
        .eq('id', user.id)
        
      if (updateError) return { data: null, error: updateError }
      return { data: { user }, error: null }
    }


    // Otherwise, perform standard Email/Password signup
    return await supabase.auth.signUp({
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
  })()

  if (authError) {
    return NextResponse.json({ error: (authError as Error).message }, { status: 400 })
  }


  // 4. Update Organization Members JSONB - Keep all members in a single array
  if (invitation.organization_id) {
    const { data: org } = await adminClient
      .from('organizations')
      .select('members')
      .eq('id', invitation.organization_id)
      .single()
      
    const currentMembers = org?.members || []
    const newMember = {
      id: authData?.user?.id || 'pending',
      email: email,
      role: invitation.role,
      joined_at: new Date().toISOString()
    }

    // append new member if not already there (prevent duplicates)
    if (!currentMembers.some((m: { email: string }) => m.email === email)) {
      await adminClient
        .from('organizations')
        .update({ members: [...currentMembers, newMember] })
        .eq('id', invitation.organization_id)
    }
  }

  // 5. Delete the invitation now that it's used
  await adminClient.from('invitations').delete().eq('id', invitation.id)


  return NextResponse.json({ 
    success: true, 
    message: 'Registration complete. Please check your email for confirmation if required by Supabase auth settings.' 
  })
}
