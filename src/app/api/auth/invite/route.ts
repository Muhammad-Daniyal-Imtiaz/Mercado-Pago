import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(request: Request) {
  const { email, role, organization_id } = await request.json()

  const supabase = await createClient()

  // 1. Get current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get current user's role and account_id - use ADMIN client to bypass RLS
  const adminClient = createAdminClient()
  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('role, organization_id, full_name, email')

    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    console.error('Invite Admin Check Error:', userError)
    return NextResponse.json({ 
      error: 'User data not found for inviter', 
      details: userError?.message 
    }, { status: 404 })
  }


  if (userData.role !== 'account_admin' && userData.role !== 'sysadmin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // IDOR PROTECTION: Check if they are part of the TARGET organization (sysadmins can bypass)
  if (userData.role !== 'sysadmin') {
    if (!userData.organization_id || userData.organization_id !== organization_id) {
       return NextResponse.json({ error: 'You can only invite members to your current active organization.' }, { status: 403 })
    }
  }


  // 3. Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiry

  // 4. Force Cleanup previous and Store invitation in DB - use ADMIN client
  await adminClient.from('invitations').delete().eq('email', email)
  const { error: inviteError } = await adminClient
    .from('invitations')
    .insert({
      email,
      role,
      organization_id, // Link to the selected organization
      invited_by: user.id,
      token: otp,
      expires_at: expiresAt.toISOString(),
    })

  if (inviteError) {
    console.error('Invite DB Error:', inviteError)
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }



  // 5. Send Email via NodeMailer (helper in lib/email.ts)
  try {
    await sendInvitationEmail({
      to: email,
      invitedBy: userData.full_name || user.email || 'Admin',
      role,
      invitationLink: otp,
      expiresAt,
    })
  } catch (error) {
    console.error('Email sending failed:', error)
    return NextResponse.json({ error: 'Invitation stored but email failed to send' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Invitation sent successfully' })
}