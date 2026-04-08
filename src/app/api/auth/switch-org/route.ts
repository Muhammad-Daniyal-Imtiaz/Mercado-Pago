import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { organization_id } = await request.json()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Get current roles
  const { data: profile } = await adminClient
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

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
    userRoles = []
  }

  // 2. Verify user has membership in target organization
  const targetRole = userRoles.find(r => r.organization_id === organization_id && r.status !== 'removed')
  
  if (!targetRole) {
    return NextResponse.json({ error: 'You are not a member of this organization' }, { status: 403 })
  }

  // 3. Update is_primary flag: set target org to true, all others to false
  const updatedRoles = userRoles.map(r => ({
    ...r,
    is_primary: r.organization_id === organization_id
  }))

  await adminClient
    .from('users')
    .update({ roles: updatedRoles })
    .eq('id', user.id)

  return NextResponse.json({ 
    success: true, 
    role: targetRole.role,
    organization_id: organization_id
  })
}
