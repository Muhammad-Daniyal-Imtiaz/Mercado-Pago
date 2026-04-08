import { createAdminClient } from '@/utils/supabase/admin'

/**
 * Sincroniza los roles entre organizaciones y el perfil del usuario
 * Esta función debe llamarse siempre que haya cambios en las organizaciones
 */
export async function syncUserRoles(userId: string) {
  const adminClient = createAdminClient()
  
  try {
    // 1. Obtener todas las organizaciones donde el usuario es miembro
    const { data: organizations, error: orgError } = await adminClient
      .from('organizations')
      .select('id, name, members')
      .contains('members', `[{"id": "${userId}"}]`)
    
    if (orgError) {
      console.error('Error obteniendo organizaciones del usuario:', orgError)
      return false
    }
    
    // 2. Obtener roles actuales del usuario
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('roles')
      .eq('id', userId)
      .single()
    
    if (userError) {
      console.error('Error obteniendo roles del usuario:', userError)
      return false
    }
    
    // 3. Parsear roles actuales
    let currentRoles: Array<{
      organization_id: string | null
      role: string
      status?: string
      is_primary?: boolean
    }> = []
    
    try {
      currentRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || [])
    } catch (err) {
      console.error('Error parseando roles actuales:', err)
      currentRoles = []
    }
    
    // 4. Construir nuevos roles basados en las organizaciones
    const newRoles = []
    let hasPrimaryRole = false
    
    // Mantener rol global si existe
    const globalRole = currentRoles.find(r => r.organization_id === null)
    if (globalRole) {
      newRoles.push(globalRole)
      hasPrimaryRole = globalRole.is_primary === true
    } else {
      // Crear rol global por defecto si no existe
      newRoles.push({
        role: 'account_user',
        status: 'active',
        is_primary: true,
        organization_id: null
      })
      hasPrimaryRole = true
    }
    
    // Agregar roles de las organizaciones
    organizations.forEach(org => {
      try {
        const members = typeof org.members === 'string' ? JSON.parse(org.members) : org.members
        const userMembership = members.find((m: any) => m.id === userId)
        
        if (userMembership && userMembership.status !== 'removed') {
          newRoles.push({
            role: userMembership.role,
            status: userMembership.status || 'active',
            is_primary: false,
            organization_id: org.id
          })
        }
      } catch (err) {
        console.error(`Error procesando organización ${org.id}:`, err)
      }
    })
    
    // 5. Actualizar roles del usuario
    const { error: updateError } = await adminClient
      .from('users')
      .update({ roles: JSON.stringify(newRoles) })
      .eq('id', userId)
    
    if (updateError) {
      console.error('Error actualizando roles del usuario:', updateError)
      return false
    }
    
    console.log(`Roles sincronizados exitosamente para usuario ${userId}:`, newRoles.length, 'roles')
    return true
    
  } catch (error) {
    console.error('Error en sincronización de roles:', error)
    return false
  }
}

/**
 * Verifica si los roles están sincronizados
 */
export async function checkRoleConsistency(userId: string): Promise<boolean> {
  const adminClient = createAdminClient()
  
  try {
    // Obtener organizaciones del usuario
    const { data: organizations, error: orgError } = await adminClient
      .from('organizations')
      .select('id, members')
      .contains('members', `[{"id": "${userId}"}]`)
    
    if (orgError) return false
    
    // Obtener roles del usuario
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('roles')
      .eq('id', userId)
      .single()
    
    if (userError) return false
    
    // Parsear roles
    let userRoles: Array<{ organization_id: string | null; role: string }> = []
    try {
      userRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || [])
    } catch {
      return false
    }
    
    // Contar roles activos en organizaciones
    let activeOrgRoles = 0
    organizations.forEach(org => {
      try {
        const members = typeof org.members === 'string' ? JSON.parse(org.members) : org.members
        const userMembership = members.find((m: any) => m.id === userId)
        if (userMembership && userMembership.status !== 'removed') {
          activeOrgRoles++
        }
      } catch {
        // Ignorar errores de parseo
      }
    })
    
    // Contar roles de organizaciones en el perfil
    const orgRolesInProfile = userRoles.filter(r => r.organization_id !== null).length
    
    return activeOrgRoles === orgRolesInProfile
    
  } catch (error) {
    console.error('Error verificando consistencia de roles:', error)
    return false
  }
}
