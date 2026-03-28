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
      
      const { error: updateError } = await adminClient
        .from('users')
        .update({
          role: invitation.role,
          organization_id: invitation.organization_id,
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
    return NextResponse.json({ error: (authError as any).message }, { status: 400 })
  }


  // 4. Delete the invitation now that it's used
  await adminClient.from('invitations').delete().eq('id', invitation.id)

  return NextResponse.json({ 
    success: true, 
    message: 'Registration complete. Please check your email for confirmation if required by Supabase auth settings.' 
  })
}
