import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { organization_id, member_id, new_role } = await request.json()
  
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
    .select('roles')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return NextResponse.json({ error: 'User data not found' }, { status: 404 })
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

  // Find role for this organization
  const userOrgRole = userRoles.find((r: { organization_id: string }) => r.organization_id === organization_id)
  const isSysadmin = userRoles.some((r: { role: string }) => r.role === 'sysadmin')

  // 3. Check permissions
  if (!isSysadmin && userOrgRole?.role !== 'account_admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // 4. IDOR Protection
  if (!isSysadmin && !userOrgRole) {
    return NextResponse.json({ error: 'You can only manage members of your organization' }, { status: 403 })
  }

  // 5. Validate role
  const validRoles = ['account_admin', 'account_user', 'account_observer']
  if (!validRoles.includes(new_role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // 6. Get organization and its members
  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .select('members')
    .eq('id', organization_id)
    .single()

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // 7. Update member role in the array
  const currentMembers = org.members || []
  const memberIndex = currentMembers.findIndex((m: { id: string }) => m.id === member_id)
  
  if (memberIndex === -1) {
    return NextResponse.json({ error: 'Member not found in organization' }, { status: 404 })
  }

  currentMembers[memberIndex].role = new_role

  // 8. Update organization members
  const { error: updateError } = await adminClient
    .from('organizations')
    .update({ members: currentMembers })
    .eq('id', organization_id)

  if (updateError) {
    console.error('Update role error:', updateError)
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 })
  }

  // 9. Update user's roles array
  const { data: memberUser } = await adminClient
    .from('users')
    .select('roles')
    .eq('id', member_id)
    .single()

  if (memberUser) {
    let userRoles = []
    try {
      userRoles = typeof memberUser.roles === 'string' ? JSON.parse(memberUser.roles) : (memberUser.roles || [])
    } catch (err) {
      userRoles = memberUser.roles || []
    }
    
    const roleIndex = userRoles.findIndex((r: { organization_id: string }) => r.organization_id === organization_id)
    if (roleIndex !== -1) {
      userRoles[roleIndex].role = new_role
    }
    
    await adminClient
      .from('users')
      .update({ roles: userRoles })
      .eq('id', member_id)
  }

  return NextResponse.json({ success: true, message: 'Role updated successfully' })
}
