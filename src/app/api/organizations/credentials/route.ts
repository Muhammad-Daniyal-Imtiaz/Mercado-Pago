import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'
import { encrypt, isEncrypted, type EncryptedData, decrypt } from '@/lib/crypto'

// GET - Verificar si la organización tiene credenciales configuradas
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requestedOrgId = searchParams.get('organizationId')

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return NextResponse.json({ 
      error: 'User data not found', 
      details: userError?.message,
      userId: user.id 
    }, { status: 404 })
  }

  let userRolesArray: any[] = []
  try {
    const rawRoles = userData.roles
    if (typeof rawRoles === 'string') {
      userRolesArray = JSON.parse(rawRoles)
    } else if (Array.isArray(rawRoles)) {
      userRolesArray = rawRoles
    }
  } catch (err) {
    console.error('JSON Parse error roles (GET):', err)
  }

  // Find all organizations where user is admin or sysadmin
  const isSysadmin = userRolesArray.some(r => r.role === 'sysadmin')
  
  // Filter for organizations where user has an active role they can manage
  const manageableRoles = userRolesArray.filter(r => 
    r.status !== 'removed' && 
    (r.role === 'account_admin' || isSysadmin)
  )

  // Get unique organization IDs from roles
  const orgIdsFromRoles = manageableRoles
    .map(r => r.organization_id)
    .filter(id => id !== null)

  // Fetch names for these organizations
  let availableOrgs: { id: string, name: string }[] = []
  if (orgIdsFromRoles.length > 0 || isSysadmin) {
    let query = adminClient.from('organizations').select('id, name')
    
    if (!isSysadmin) {
      query = query.in('id', orgIdsFromRoles)
    }

    const { data: orgs } = await query
    availableOrgs = orgs || []
  }

  // Decide which organization to show
  let organizationId = requestedOrgId

  if (!organizationId) {
    // Try to find the primary org or the first manageable one
    const primaryRole = manageableRoles.find(r => r.is_primary) || manageableRoles[0]
    organizationId = primaryRole?.organization_id
  }

  // Fallback for users who created an org but might not have the role in their array yet
  if (!organizationId) {
    const { data: createdOrg } = await adminClient
      .from('organizations')
      .select('id, name')
      .eq('created_by', user.id)
      .limit(1)
      .maybeSingle()
    if (createdOrg) {
      organizationId = createdOrg.id
      if (!availableOrgs.some(o => o.id === organizationId)) {
        availableOrgs.push(createdOrg)
      }
    }
  }

  if (!organizationId) {
    return NextResponse.json({ 
      error: 'No organization available',
      availableOrgs 
    }, { status: 400 })
  }

  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .select('name, metadata')
    .eq('id', organizationId)
    .single()

  if (orgError) {
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
  }

  const metadata = (org?.metadata as any) || {}
  const encryptedToken = metadata.mp_access_token_encrypted
  const hasCredentials = !!(encryptedToken && isEncrypted(encryptedToken))
  
  let accessToken = null
  if (hasCredentials) {
    try {
      accessToken = decrypt(encryptedToken)
    } catch (err) {
      console.error('Error decrypting token:', err)
    }
  }

  return NextResponse.json({ 
    hasCredentials,
    accessToken,
    organizationId,
    organizationName: org?.name || 'Organización sin nombre',
    availableOrgs
  })
}

// POST - Guardar/Actualizar credenciales de Mercado Pago
export async function POST(request: Request) {
  try {
    const { accessToken, organizationId: providedOrgId } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    if (!accessToken.startsWith('APP_USR-') && !accessToken.startsWith('TEST-')) {
      return NextResponse.json({ 
        error: 'Invalid token format. Must start with APP_USR- or TEST-' 
      }, { status: 400 })
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 })
    }

    let userRolesArray: any[] = []
    try {
      const rawRoles = userData.roles
      if (typeof rawRoles === 'string') {
        userRolesArray = JSON.parse(rawRoles)
      } else if (Array.isArray(rawRoles)) {
        userRolesArray = rawRoles
      }
    } catch (err) {
      console.error('JSON Parse error roles (POST):', err)
    }

    const manageableRoles = userRolesArray.filter(r => r.status !== 'removed' && (r.role === 'account_admin' || userRolesArray.some(x => x.role === 'sysadmin')))
    const currentOrgRole = manageableRoles.find(r => r.organization_id === providedOrgId) || manageableRoles[0]

    if (!currentOrgRole && !userRolesArray.some(x => x.role === 'sysadmin')) {
      return NextResponse.json({ error: 'No active role found' }, { status: 400 })
    }

    const organizationId = providedOrgId || currentOrgRole?.organization_id

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization available' }, { status: 400 })
    }

    const encryptedToken: EncryptedData = encrypt(accessToken)

    const { data: org, error: fetchError } = await adminClient
      .from('organizations')
      .select('metadata')
      .eq('id', organizationId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
    }

    const updatedMetadata = {
      ...((org?.metadata as any) || {}),
      mp_access_token_encrypted: encryptedToken,
      mp_token_updated_at: new Date().toISOString(),
      mp_token_updated_by: user.id
    }

    const { data: updateResult, error: updateError } = await adminClient
      .from('organizations')
      .update({ metadata: updatedMetadata })
      .eq('id', organizationId)
      .select('id')

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save credentials', details: updateError.message }, { status: 500 })
    }

    if (!updateResult || updateResult.length === 0) {
      return NextResponse.json({ error: 'Organization not found or no changes made' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Credenciales guardadas exitosamente',
      organizationId,
      hasCredentials: true,
      accessToken: accessToken
    })
  } catch (err: any) {
    console.error('POST /credentials error:', err)
    return NextResponse.json({ error: 'Server error occurred', details: err.message }, { status: 500 })
  }
}
