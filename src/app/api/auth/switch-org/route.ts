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

  // 1. Verify user actually has a membership in this organization
  const { data: profile } = await adminClient
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  const userRoles = profile?.roles || []
  const targetRole = userRoles.find((r: { organization_id: string }) => r.organization_id === organization_id)

  if (!targetRole) {
    return NextResponse.json({ error: 'You are not a member of this organization' }, { status: 403 })
  }

  // 2. Update the profile row's current state to "switch" the dashboard context
  await adminClient
    .from('users')
    .update({ 
      organization_id: organization_id,
      role: targetRole.role 
    })
    .eq('id', user.id)

  return NextResponse.json({ success: true, role: targetRole.role })
}
