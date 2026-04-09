const { createClient } = require('@supabase/supabase-js')

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

async function checkCurrentSession() {
  const adminClient = createAdminClient()
  const userEmail = 'guillermoandrada@gmail.com'
  
  try {
    console.log('=== VERIFICANDO SESIÓN ACTUAL ===')
    console.log(`Usuario: ${userEmail}`)
    
    // 1. Obtener el usuario
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id, email, roles, full_name')
      .eq('email', userEmail)
      .single()
    
    if (userError || !user) {
      console.error('Error obteniendo usuario:', userError)
      return
    }
    
    console.log(`\n--- DATOS DEL USUARIO ---`)
    console.log(`ID: ${user.id}`)
    console.log(`Email: ${user.email}`)
    console.log(`Nombre: ${user.full_name || 'No configurado'}`)
    
    // 2. Parsear roles
    let roles = []
    try {
      roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || [])
    } catch (err) {
      console.error('Error parseando roles:', err)
      roles = []
    }
    
    console.log(`\n--- ROLES DEL PERFIL (${roles.length}) ---`)
    roles.forEach((role, index) => {
      const orgName = role.organization_id ? `Org: ${role.organization_id}` : 'Global'
      const primary = role.is_primary ? ' [PRIMARIO]' : ''
      const status = role.status || 'active'
      console.log(`${index + 1}. ${role.role} (${orgName}) - ${status}${primary}`)
    })
    
    // 3. Calcular rol efectivo según lógica del sistema
    const activeRoles = roles.filter(r => r.status !== 'removed')
    const isSysadmin = activeRoles.some(r => r.role === 'sysadmin')
    const primaryRole = activeRoles.find(r => r.is_primary) || activeRoles[0]
    const effectiveRole = isSysadmin ? 'sysadmin' : (primaryRole?.role || 'account_user')
    
    console.log(`\n--- ROL EFECTIVO ---`)
    console.log(`Rol efectivo: ${effectiveRole}`)
    console.log(`¿Es sysadmin?: ${isSysadmin ? 'SÍ' : 'NO'}`)
    console.log(`Rol primario: ${primaryRole?.role || 'Ninguno'}`)
    
    // 4. Obtener organizaciones donde es miembro
    const { data: organizations, error: orgError } = await adminClient
      .from('organizations')
      .select('id, name, members')
    
    if (orgError) {
      console.error('Error obteniendo organizaciones:', orgError)
      return
    }
    
    console.log(`\n--- ORGANIZACIONES DONDE ES MIEMBRO ---`)
    
    let userOrgs = []
    organizations.forEach(org => {
      try {
        const members = typeof org.members === 'string' ? JSON.parse(org.members) : org.members
        const userMembership = members.find(m => m.id === user.id)
        
        if (userMembership) {
          userOrgs.push({
            id: org.id,
            name: org.name,
            role: userMembership.role,
            status: userMembership.status || 'active',
            joined_at: userMembership.joined_at
          })
          
          console.log(`- ${org.name} (${org.id})`)
          console.log(`  Rol: ${userMembership.role}`)
          console.log(`  Status: ${userMembership.status || 'active'}`)
          console.log(`  Miembro desde: ${userMembership.joined_at || 'N/A'}`)
        }
      } catch (err) {
        console.error(`Error procesando organización ${org.name}:`, err)
      }
    })
    
    // 5. Verificar consistencia
    console.log(`\n--- VERIFICACIÓN DE CONSISTENCIA ---`)
    console.log(`Roles en perfil: ${roles.length}`)
    console.log(`Organizaciones donde es miembro: ${userOrgs.length}`)
    
    // Contar roles activos por organización
    const activeOrgRoles = roles.filter(r => r.organization_id !== null && r.status !== 'removed')
    console.log(`Roles activos en organizaciones: ${activeOrgRoles.length}`)
    
    // Verificar si hay inconsistencias
    const inconsistencies = []
    
    // Verificar que cada organización donde es miembro tenga un rol correspondiente
    userOrgs.forEach(org => {
      const roleInProfile = roles.find(r => r.organization_id === org.id)
      if (!roleInProfile) {
        inconsistencies.push(`Falta rol para organización: ${org.name}`)
      } else if (roleInProfile.role !== org.role) {
        inconsistencies.push(`Rol diferente en ${org.name}: Perfil=${roleInProfile.role}, Org=${org.role}`)
      }
    })
    
    // Verificar que no haya roles de organizaciones donde ya no es miembro
    roles.filter(r => r.organization_id !== null).forEach(role => {
      const orgMembership = userOrgs.find(org => org.id === role.organization_id)
      if (!orgMembership) {
        inconsistencies.push(`Rol huérfano para organización: ${role.organization_id}`)
      }
    })
    
    if (inconsistencies.length === 0) {
      console.log('¡CONSISTENTE! No se encontraron inconsistencias.')
    } else {
      console.log(`\n¡INCONSISTENCIAS ENCONTRADAS (${inconsistencies.length}):`)
      inconsistencies.forEach((inconsistency, index) => {
        console.log(`${index + 1}. ${inconsistency}`)
      })
    }
    
    // 6. Recomendaciones
    console.log(`\n--- RECOMENDACIONES ---`)
    if (inconsistencies.length > 0) {
      console.log('Se recomienda ejecutar sincronización de roles:')
      console.log('curl -X POST http://localhost:3001/api/auth/sync-roles')
    } else {
      console.log('Los roles están sincronizados correctamente.')
      console.log('La interfaz debería mostrar el rol:', effectiveRole)
    }
    
    // 7. Health check rápido
    console.log(`\n--- HEALTH CHECK RÁPIDO ---`)
    const healthStatus = inconsistencies.length === 0 ? 'HEALTHY' : 'WARNING'
    console.log(`Status: ${healthStatus}`)
    console.log(`Total roles: ${roles.length}`)
    console.log(`Roles activos: ${activeRoles.length}`)
    console.log(`Inconsistencias: ${inconsistencies.length}`)
    
  } catch (error) {
    console.error('Error general:', error)
  }
}

// Ejecutar el script
checkCurrentSession()
