import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { organization_id, name, metadata } = await request.json()

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

  // 2. Get user's role
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
    return NextResponse.json({ error: 'You can only update your organization' }, { status: 403 })
  }

  // 5. Build update object
  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (metadata !== undefined) updateData.metadata = metadata

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // 6. Update organization
  const { data: updatedOrg, error: updateError } = await adminClient
    .from('organizations')
    .update(updateData)
    .eq('id', organization_id)
    .select()
    .single()

  if (updateError) {
    console.error('Update organization error:', updateError)
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
  }

  return NextResponse.json({ success: true, organization: updatedOrg })
}
