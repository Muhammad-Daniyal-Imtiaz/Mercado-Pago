import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { organization_id } = await request.json()

  if (!organization_id) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get user's roles
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

  // 3. Check permissions - only admins can delete organizations
  if (!isSysadmin && userOrgRole?.role !== 'account_admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // 4. IDOR Protection - verify user belongs to this organization
  if (!isSysadmin && !userOrgRole) {
    return NextResponse.json({ error: 'You can only delete your organization' }, { status: 403 })
  }

  // 5. Get organization to verify the user is the creator (for non-sysadmins)
  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .select('created_by')
    .eq('id', organization_id)
    .single()

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // Only creator or sysadmin can delete
  if (!isSysadmin && org.created_by !== user.id) {
    return NextResponse.json({ error: 'Only the organization creator can delete it' }, { status: 403 })
  }

  // 6. Remove organization reference from all members' roles
  const { data: orgData } = await adminClient
    .from('organizations')
    .select('members')
    .eq('id', organization_id)
    .single()

  if (orgData && orgData.members) {
    const members = Array.isArray(orgData.members) ? orgData.members : []
    
    for (const member of members) {
      const { data: memberUser } = await adminClient
        .from('users')
        .select('roles')
        .eq('id', member.id)
        .single()

      if (memberUser) {
        let userRoles = []
        try {
          userRoles = typeof memberUser.roles === 'string' 
            ? JSON.parse(memberUser.roles) 
            : (memberUser.roles || [])
        } catch {
          userRoles = memberUser.roles || []
        }
        
        const updatedRoles = userRoles.filter(
          (r: { organization_id: string }) => r.organization_id !== organization_id
        )
        
        await adminClient
          .from('users')
          .update({ roles: updatedRoles })
          .eq('id', member.id)
      }
    }
  }

  // 7. Delete the organization
  const { error: deleteError } = await adminClient
    .from('organizations')
    .delete()
    .eq('id', organization_id)

  if (deleteError) {
    console.error('Delete organization error:', deleteError)
    return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Organization deleted successfully' })
}
