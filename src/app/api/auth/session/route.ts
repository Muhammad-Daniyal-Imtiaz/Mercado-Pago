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
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.user_metadata?.full_name || authUser.email,
        role: authUser.user_metadata?.role || 'account_user',
        organization: null,
        memberships: []
      }
    })
  }

  // Resolve all organizations the user is a member of
  const userRoles = profile.roles || []
  const { data: userOrgs } = await adminClient
    .from('organizations')
    .select('id, name')
    .in('id', userRoles.map((r: { organization_id: string }) => r.organization_id))

  const memberships = userRoles.map((r: { organization_id: string; role: string }) => {
    const org = userOrgs?.find(o => o.id === r.organization_id)
    return {
      organization_id: r.organization_id,
      name: org?.name || 'Unknown Portal',
      role: r.role
    }
  })

  // The active session is based on the current profile row's organization_id
  const activeOrg = memberships.find((m: { organization_id: string }) => m.organization_id === profile.organization_id) || memberships[0] || null

  return NextResponse.json({
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      role: activeOrg?.role || profile.role,
      organization: activeOrg,
      memberships: memberships
    }
  })
}
