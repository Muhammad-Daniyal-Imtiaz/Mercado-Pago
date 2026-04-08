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

async function changeUserRole() {
  const adminClient = createAdminClient()
  const userEmail = 'guillermoandrada@gmail.com'
  const newRole = 'sysadmin' // Cambiar esto al rol deseado
  
  try {
    console.log('=== CAMBIAR ROL DE USUARIO ===')
    console.log(`Usuario: ${userEmail}`)
    console.log(`Nuevo rol: ${newRole}`)
    
    // 1. Obtener el usuario
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id, email, roles')
      .eq('email', userEmail)
      .single()
    
    if (userError || !user) {
      console.error('Error obteniendo usuario:', userError)
      return
    }
    
    console.log(`Usuario encontrado: ${user.id}`)
    
    // 2. Obtener roles actuales
    let currentRoles = []
    try {
      currentRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || [])
    } catch (err) {
      console.error('Error parseando roles actuales:', err)
      currentRoles = []
    }
    
    console.log('Roles actuales:')
    currentRoles.forEach((role, index) => {
      console.log(`${index + 1}. ${role.role} (org: ${role.organization_id || 'Global'})`)
    })
    
    // 3. Estrategias para cambiar el rol
    
    console.log('\n=== OPCIONES DE CAMBIO ===')
    console.log('1. Cambiar rol global (account_user)')
    console.log('2. Cambiar rol en organización específica')
    console.log('3. Agregar sysadmin a todas las organizaciones')
    console.log('4. Reset completo y asignar nuevo rol')
    
    // Opción 1: Cambiar rol global
    const globalRoleIndex = currentRoles.findIndex(r => r.organization_id === null)
    
    if (globalRoleIndex >= 0) {
      console.log(`\n--- Opción 1: Cambiando rol global ---`)
      currentRoles[globalRoleIndex].role = newRole
      
      const { error: updateError } = await adminClient
        .from('users')
        .update({ roles: JSON.stringify(currentRoles) })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('Error actualizando rol global:', updateError)
      } else {
        console.log('Rol global actualizado exitosamente')
      }
    } else {
      console.log('No se encontró rol global. Creando uno nuevo...')
      
      currentRoles.push({
        role: newRole,
        status: 'active',
        is_primary: true,
        organization_id: null
      })
      
      const { error: updateError } = await adminClient
        .from('users')
        .update({ roles: JSON.stringify(currentRoles) })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('Error creando rol global:', updateError)
      } else {
        console.log('Rol global creado exitosamente')
      }
    }
    
    // 4. Verificar resultado
    console.log('\n=== VERIFICACIÓN ===')
    
    const { data: updatedUser } = await adminClient
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single()
    
    let updatedRoles = []
    try {
      updatedRoles = typeof updatedUser.roles === 'string' ? JSON.parse(updatedUser.roles) : (updatedUser.roles || [])
    } catch (err) {
      console.error('Error parseando roles actualizados:', err)
      updatedRoles = []
    }
    
    console.log('Roles actualizados:')
    updatedRoles.forEach((role, index) => {
      console.log(`${index + 1}. ${role.role} (org: ${role.organization_id || 'Global'})`)
    })
    
    // 5. Verificar rol efectivo según lógica del sistema
    const isSysadmin = updatedRoles.some(r => r.role === 'sysadmin')
    const primaryRole = updatedRoles.find(r => r.is_primary) || updatedRoles[0]
    const effectiveRole = isSysadmin ? 'sysadmin' : (primaryRole?.role || 'account_user')
    
    console.log(`\nRol efectivo en la interfaz: ${effectiveRole}`)
    console.log(`¿Es sysadmin?: ${isSysadmin ? 'SÍ' : 'NO'}`)
    
    console.log('\n=== SIGUIENTES PASOS ===')
    console.log('1. Haz logout de la aplicación')
    console.log('2. Haz login nuevamente')
    console.log('3. Verifica que el rol se muestre correctamente en la interfaz')
    console.log('4. Si no se muestra, usa /api/auth/sync-roles para forzar sincronización')
    
  } catch (error) {
    console.error('Error general:', error)
  }
}

// Ejecutar el script
changeUserRole()
