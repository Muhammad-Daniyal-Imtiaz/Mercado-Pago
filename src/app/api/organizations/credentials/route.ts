import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'
import { encrypt, isEncrypted, type EncryptedData, decrypt } from '@/lib/crypto'

// GET - Verificar si la organización tiene credenciales configuradas
export async function GET(request: Request) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get user's profile with roles and primary organization
  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('roles, primary_organization_id')
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
  }> = []
  try {
    userRoles = typeof userData.roles === 'string' 
      ? JSON.parse(userData.roles) 
      : (userData.roles || [])
  } catch {
    userRoles = []
  }

  // Get current organization (primary or first active)
  const primaryOrgId = userData.primary_organization_id
  const currentOrgRole = userRoles.find(r => r.organization_id === primaryOrgId && r.status === 'active')
    || userRoles.find(r => r.status === 'active')

  if (!currentOrgRole) {
    return NextResponse.json({ error: 'No active organization found' }, { status: 400 })
  }

  const organizationId = currentOrgRole.organization_id

  // 3. Check permissions (only account_admin or sysadmin can manage credentials)
  const isSysadmin = userRoles.some(r => r.role === 'sysadmin')
  const isAdmin = currentOrgRole.role === 'account_admin' || isSysadmin

  if (!isAdmin) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // 4. Get organization and check for MP credentials
  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .select('metadata')
    .eq('id', organizationId)
    .single()

  if (orgError) {
    console.error('Error fetching organization:', orgError)
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
  }

  // Check if mp_access_token_encrypted exists in metadata
  const metadata = org?.metadata || {}
  const hasCredentials = !!(metadata.mp_access_token_encrypted && isEncrypted(metadata.mp_access_token_encrypted))

  return NextResponse.json({ 
    hasCredentials,
    organizationId
  })
}

// POST - Guardar/Actualizar credenciales de Mercado Pago
export async function POST(request: Request) {
  const { accessToken } = await request.json()

  if (!accessToken) {
    return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
  }

  // Basic validation for MP token format
  if (!accessToken.startsWith('APP_USR-') && !accessToken.startsWith('TEST-')) {
    return NextResponse.json({ 
      error: 'Invalid token format. Must start with APP_USR- or TEST-' 
    }, { status: 400 })
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get user's profile with roles
  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('roles, primary_organization_id')
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
  }> = []
  try {
    userRoles = typeof userData.roles === 'string' 
      ? JSON.parse(userData.roles) 
      : (userData.roles || [])
  } catch {
    userRoles = []
  }

  // Get current organization
  const primaryOrgId = userData.primary_organization_id
  const currentOrgRole = userRoles.find(r => r.organization_id === primaryOrgId && r.status === 'active')
    || userRoles.find(r => r.status === 'active')

  if (!currentOrgRole) {
    return NextResponse.json({ error: 'No active organization found' }, { status: 400 })
  }

  const organizationId = currentOrgRole.organization_id

  // 3. Check permissions
  const isSysadmin = userRoles.some(r => r.role === 'sysadmin')
  const isAdmin = currentOrgRole.role === 'account_admin' || isSysadmin

  if (!isAdmin) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // 4. Encrypt the access token before saving
  const encryptedToken: EncryptedData = encrypt(accessToken)

  // 5. Update organization metadata with encrypted MP credentials
  const { data: org, error: fetchError } = await adminClient
    .from('organizations')
    .select('metadata')
    .eq('id', organizationId)
    .single()

  if (fetchError) {
    console.error('Error fetching organization:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
  }

  const currentMetadata = org?.metadata || {}
  
  const updatedMetadata = {
    ...currentMetadata,
    mp_access_token_encrypted: encryptedToken,
    mp_token_updated_at: new Date().toISOString(),
    mp_token_updated_by: user.id
  }

  // Remove old unencrypted field if it exists (migration)
  delete updatedMetadata.mp_access_token

  const { error: updateError } = await adminClient
    .from('organizations')
    .update({ metadata: updatedMetadata })
    .eq('id', organizationId)

  if (updateError) {
    console.error('Error updating credentials:', updateError)
    return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true,
    message: 'Credentials saved successfully'
  })
}
