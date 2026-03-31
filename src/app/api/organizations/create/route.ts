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
    console.error('Org Create Auth Error:', authError) // Added log
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Fetch user's profile to confirm role - use ADMIN client to bypass RLS
  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    console.error('Org Create Admin Check Error:', userError)
    return NextResponse.json({
      error: 'User data not found for creator',
      details: userError?.message
    }, { status: 404 })
  }


  if (userData.role !== 'sysadmin' && userData.role !== 'account_admin') {
    console.warn(`User ${user.id} with role ${userData.role} attempted to create organization.`) // Added log
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

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
          role: userData.role,
          full_name: userData.full_name || user.email
        }
      ]
    })
    .select()
    .single()


  if (orgError) {
    console.error('Org Insert Error:', orgError)
    return NextResponse.json({ error: orgError.message }, { status: 500 })
  }

  // 4. Update the creator's organization_id - use ADMIN client
  await adminClient
    .from('users')
    .update({ organization_id: orgData.id })
    .eq('id', user.id)


  return NextResponse.json({ success: true, organization: orgData })
}
