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

  // 3. Create the user in Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: invitation.role,
        organization_id: invitation.organization_id,
        full_name: fullName, // Pass the full name from the form

      },
    },
  })


  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // 4. Delete the invitation now that it's used
  await adminClient.from('invitations').delete().eq('id', invitation.id)

  return NextResponse.json({ 
    success: true, 
    message: 'Registration complete. Please check your email for confirmation if required by Supabase auth settings.' 
  })
}
