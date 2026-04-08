import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
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
  const userOrgRole = userRoles.find((r: { organization_id: string }) => r.organization_id === id)
  const isSysadmin = userRoles.some((r: { role: string }) => r.role === 'sysadmin')

  // 3. Check permissions
  if (!isSysadmin && userOrgRole?.role !== 'account_admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // 4. IDOR Protection - sysadmin can view any, others only their org
  if (!isSysadmin && !userOrgRole) {
    return NextResponse.json({ error: 'You can only view your organization' }, { status: 403 })
  }

  // 5. Get organization
  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .select('id, name, members, metadata, created_at, created_by')
    .eq('id', id)
    .single()

  if (orgError) {
    console.error('Organization fetch error:', orgError)
    return NextResponse.json({ error: `Database error: ${orgError.message}` }, { status: 500 })
  }

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  return NextResponse.json({ organization: org })
}
