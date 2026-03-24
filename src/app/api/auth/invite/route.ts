import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email, role, accountId } = await request.json()

    // Get current user from auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if current user is account admin or sysadmin
    const adminClient = createAdminClient()
    const { data: currentUser } = await adminClient
      .from('users')
      .select('role, account_id')
      .eq('id', user.id)
      .single()

    if (!currentUser || (currentUser.role !== 'account_admin' && currentUser.role !== 'sysadmin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Validate role
    const validRoles = ['account_user', 'account_observer']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role for invitation' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Generate invitation token
    const invitationToken = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48) // 48 hours

    // Create invitation record
    const { error: inviteError } = await adminClient
      .from('users')
      .insert({
        email,
        role,
        account_id: accountId || currentUser.account_id,
        invited_by: user.id,
        invitation_token: invitationToken,
        invitation_expires_at: expiresAt.toISOString(),
        is_active: false,
        is_verified: false
      })

    if (inviteError) {
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Send invitation email
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${invitationToken}`
    
    await sendInvitationEmail({
      to: email,
      invitedBy: currentUser.full_name || 'An administrator',
      role,
      invitationLink,
      expiresAt
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully'
    })

  } catch (error) {
    console.error('Invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}