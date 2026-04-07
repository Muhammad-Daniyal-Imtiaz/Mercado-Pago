import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(request: Request) {
  const { organization_id, member_email } = await request.json()
  
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get current user's roles
  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('roles, full_name, email')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return NextResponse.json({ error: 'User data not found for inviter', details: userError?.message }, { status: 404 })
  }

  // Parse roles
  let userRoles: Array<{
    organization_id: string
    role: string
    status?: string
    is_primary?: boolean
  }> = []
  try {
    userRoles = typeof userData.roles === 'string' ? JSON.parse(userData.roles) : (userData.roles || [])
  } catch {
    userRoles = []
  }

  // Find role for target organization
  const userOrgRole = userRoles.find((r: { organization_id: string }) => r.organization_id === organization_id)
  const isSysadmin = userRoles.some((r: { role: string }) => r.role === 'sysadmin')

  // Check permissions
  if (!isSysadmin && userOrgRole?.role !== 'account_admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // IDOR PROTECTION: Check if they are part of the TARGET organization
  if (!isSysadmin && !userOrgRole) {
    return NextResponse.json({ error: 'You can only invite members to organizations you belong to.' }, { status: 403 })
  }

  // 5. Get organization
  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .select('name, members')
    .eq('id', organization_id)
    .single()

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // 6. Find member in organization
  const members = org.members || []
  const member = members.find((m: { email: string }) => m.email === member_email)
  
  if (!member) {
    return NextResponse.json({ error: 'Member not found in organization' }, { status: 404 })
  }

  // 7. Check for existing pending invitation
  const { data: existingInvite } = await adminClient
    .from('invitations')
    .select('*')
    .eq('email', member_email)
    .eq('organization_id', organization_id)
    .single()

  let otp: string
  let expiresAt: Date

  if (existingInvite) {
    // Regenerate OTP for existing invitation
    otp = Math.floor(100000 + Math.random() * 900000).toString()
    expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    
    await adminClient
      .from('invitations')
      .update({ token: otp, expires_at: expiresAt.toISOString() })
      .eq('id', existingInvite.id)
  } else {
    // Create new invitation
    otp = Math.floor(100000 + Math.random() * 900000).toString()
    expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    
    const { error: inviteError } = await adminClient
      .from('invitations')
      .insert({
        email: member_email,
        role: member.role || 'account_user',
        organization_id,
        invited_by: user.id,
        token: otp,
        expires_at: expiresAt.toISOString(),
      })

    if (inviteError) {
      console.error('Invitation creation error:', inviteError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }
  }

  // 8. Send email
  try {
    await sendInvitationEmail({
      to: member_email,
      invitedBy: userData.full_name || user.email || 'Admin',
      role: member.role || 'account_user',
      invitationLink: otp,
      expiresAt,
    })
  } catch (error) {
    console.error('Email sending failed:', error)
    return NextResponse.json({ error: 'Invitation updated but email failed to send' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Invitation resent successfully' })
}
