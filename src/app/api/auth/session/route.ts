import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const { data: profile, error: profileError } = await adminClient
    .from('users')
    .select('id, email, full_name, avatar_url, is_verified, roles')
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.user_metadata?.full_name || authUser.email,
        role: 'account_user',
        isVerified: authUser.user_metadata?.is_verified || false,
        organization: null,
        memberships: []
      }
    })
  }

  // Parse roles JSONB array - this is the single source of truth for user permissions
  let userRoles: Array<{
    organization_id: string
    role: string
    status?: string
    is_primary?: boolean
  }> = []
  
  try {
    userRoles = typeof profile.roles === 'string' 
      ? JSON.parse(profile.roles) 
      : (profile.roles || [])
  } catch (err) {
    console.error('Error parsing roles:', err)
    userRoles = []
  }

  // Filter active memberships only
  const activeRoles = userRoles.filter(r => r.status !== 'removed')

  // Get organization details for all memberships
  const orgIds = activeRoles.map(r => r.organization_id)
  
  let userOrgs: Array<{ id: string; name: string }> = []
  if (orgIds.length > 0) {
    const { data: orgs } = await adminClient
      .from('organizations')
      .select('id, name')
      .in('id', orgIds)
    userOrgs = orgs || []
  }

  // Build memberships array
  const memberships = activeRoles.map(r => {
    const org = userOrgs.find(o => o.id === r.organization_id)
    return {
      organization_id: r.organization_id,
      name: org?.name || 'Equipo no asignado',
      role: r.role,
      status: r.status || 'active',
      is_primary: r.is_primary || false
    }
  })

  // Determine active organization:
  // 1. First try the one marked as primary
  // 2. Then fall back to first active membership
  // 3. Null if no memberships
  const activeOrg = memberships.find(m => m.is_primary) || memberships[0] || null

  // Determine effective role:
  // - 'sysadmin' is determined by having role='sysadmin' in ANY organization
  // - Otherwise use the active organization's role
  const isSysadmin = activeRoles.some(r => r.role === 'sysadmin')
  const effectiveRole = isSysadmin ? 'sysadmin' : (activeOrg?.role || 'account_user')

  return NextResponse.json({
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      isVerified: profile.is_verified,
      role: effectiveRole,
      organization: activeOrg,
      memberships: memberships,
      isSysadmin
    }
  })
}
