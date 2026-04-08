import { createAdminClient } from '@/utils/supabase/admin'
import { decrypt, isEncrypted } from '@/lib/crypto'

export interface MPCredentials {
  accessToken: string
  updatedAt: string
  updatedBy: string
}

/**
 * Retrieves and decrypts Mercado Pago credentials for an organization
 * This function should ONLY be called server-side
 */
export async function getOrganizationMPCredentials(
  organizationId: string
): Promise<MPCredentials | null> {
  const adminClient = createAdminClient()

  const { data: org, error } = await adminClient
    .from('organizations')
    .select('metadata')
    .eq('id', organizationId)
    .single()

  if (error || !org) {
    console.error('Error fetching organization credentials:', error)
    return null
  }

  const metadata = org.metadata || {}
  const encryptedData = metadata.mp_access_token_encrypted

  // Check if we have encrypted credentials
  if (!encryptedData || !isEncrypted(encryptedData)) {
    return null
  }

  try {
    const accessToken = decrypt(encryptedData)
    
    return {
      accessToken,
      updatedAt: metadata.mp_token_updated_at || '',
      updatedBy: metadata.mp_token_updated_by || ''
    }
  } catch (err) {
    console.error('Error decrypting MP credentials:', err)
    return null
  }
}

/**
 * Helper to get credentials from the current user's primary organization
 * Should be used in API routes where we have the user context
 */
export async function getCurrentUserOrganizationMPCredentials(
  userId: string
): Promise<{ credentials: MPCredentials | null; organizationId: string | null }> {
  const adminClient = createAdminClient()

  // Get user's roles
  const { data: user, error: userError } = await adminClient
    .from('users')
    .select('roles')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    console.error('Error fetching user:', userError)
    return { credentials: null, organizationId: null }
  }

  // Find active organization from roles
  let organizationId: string | null = null
  
  if (user.roles) {
    const roles = typeof user.roles === 'string' 
      ? JSON.parse(user.roles) 
      : user.roles
    
    const activeRole = roles.find((r: { status: string; organization_id: string }) => r.status === 'active')
    if (activeRole) {
      organizationId = activeRole.organization_id
    }
  }

  if (!organizationId) {
    return { credentials: null, organizationId: null }
  }

  const credentials = await getOrganizationMPCredentials(organizationId)
  
  return { credentials, organizationId }
}
