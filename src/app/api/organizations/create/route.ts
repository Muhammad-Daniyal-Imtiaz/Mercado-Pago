import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { name } = await request.json()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('Org Create Auth Error:', authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Fetch user's profile to confirm role - use ADMIN client to bypass RLS
  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('roles, full_name')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    console.error('Org Create Admin Check Error:', userError)
    return NextResponse.json({
      error: 'User data not found for creator',
      details: userError?.message
    }, { status: 404 })
  }

  // Parse roles to check permissions
  let userRoles: Array<{
    organization_id: string
    role: string
    status?: string
    is_primary?: boolean
  }> = []
  
  try {
    userRoles = typeof userData.roles === 'string' 
      ? JSON.parse(userData.roles) 
      : (userData.roles || [])
  } catch (err) {
    userRoles = []
  }

  // Check if user has sysadmin role in any org or is creating first org
  const isSysadmin = userRoles.some(r => r.role === 'sysadmin')
  const hasAdminRole = userRoles.some(r => r.role === 'account_admin')
  
  if (!isSysadmin && !hasAdminRole && userRoles.length > 0) {
    console.warn(`User ${user.id} attempted to create organization without admin rights.`)
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Default role for creator in new organization
  const creatorRole = isSysadmin ? 'sysadmin' : 'account_admin'

  // 3. Create organization with initial member JSONB array
  const { data: orgData, error: orgError } = await adminClient
    .from('organizations')
    .insert({
      name,
      created_by: user.id,
      members: [
        {
          id: user.id,
          email: user.email,
          role: creatorRole,
          full_name: userData.full_name || user.email,
          status: 'active'
        }
      ]
    })
    .select()
    .single()

  if (orgError) {
    console.error('Org Insert Error:', orgError)
    return NextResponse.json({ error: orgError.message }, { status: 500 })
  }

  // 4. Add new organization to user's roles array with is_primary flag
  // Unset is_primary from all existing roles, then add new one with is_primary: true
  const updatedRoles = [
    ...userRoles.map(r => ({ ...r, is_primary: false })),
    {
      organization_id: orgData.id,
      role: creatorRole,
      status: 'active',
      is_primary: true
    }
  ]

  await adminClient
    .from('users')
    .update({ roles: updatedRoles })
    .eq('id', user.id)

  return NextResponse.json({ success: true, organization: orgData })
}
