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

async function resetUserData() {
  const adminClient = createAdminClient()
  const userEmail = 'guillermoandrada@gmail.com'
  
  try {
    console.log('=== INICIANDO LIMPIEZA DE DATOS DE USUARIO ===')
    console.log(`Usuario: ${userEmail}`)
    
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
    console.log('Roles actuales:', user.roles)
    
    // 2. Obtener organizaciones donde es miembro
    const { data: organizations, error: orgError } = await adminClient
      .from('organizations')
      .select('id, name, members, created_by')
    
    if (orgError) {
      console.error('Error obteniendo organizaciones:', orgError)
      return
    }
    
    console.log(`\n=== ORGANIZACIONES ENCONTRADAS: ${organizations.length} ===`)
    
    // 3. Procesar cada organización
    for (const org of organizations) {
      try {
        const members = typeof org.members === 'string' ? JSON.parse(org.members) : org.members
        const userMembership = members.find(m => m.id === user.id)
        
        if (userMembership) {
          console.log(`\n--- Organización: ${org.name} (${org.id}) ---`)
          console.log(`Rol actual: ${userMembership.role}`)
          console.log(`Creador: ${org.created_by}`)
          console.log(`¿Es creador?: ${org.created_by === user.id ? 'SÍ' : 'NO'}`)
          
          if (org.created_by === user.id) {
            console.log('¡ADVERTENCIA! Eres el creador de esta organización.')
            console.log('Opciones:')
            console.log('1. Eliminar organización completamente (peligroso)')
            console.log('2. Transferir propiedad a otro miembro')
            console.log('3. Solo eliminarte como miembro (dejar org huérfana)')
            
            // Por seguridad, solo eliminamos como miembro si no es creador
            if (members.length > 1) {
              // Transferir propiedad al siguiente miembro
              const otherMembers = members.filter(m => m.id !== user.id)
              const newCreator = otherMembers[0]
              
              const updatedMembers = members.filter(m => m.id !== user.id)
              
              await adminClient
                .from('organizations')
                .update({ 
                  members: JSON.stringify(updatedMembers),
                  created_by: newCreator.id 
                })
                .eq('id', org.id)
              
              console.log(`Propiedad transferida a: ${newCreator.email || newCreator.id}`)
              console.log('Usuario eliminado de la organización')
            } else {
              console.log('Eres el único miembro. La organización quedará huérfana.')
              
              const updatedMembers = []
              
              await adminClient
                .from('organizations')
                .update({ 
                  members: JSON.stringify(updatedMembers),
                  created_by: null 
                })
                .eq('id', org.id)
              
              console.log('Organización dejada huérfana (sin creador ni miembros)')
            }
          } else {
            // Eliminar usuario de la organización
            const updatedMembers = members.filter(m => m.id !== user.id)
            
            await adminClient
              .from('organizations')
              .update({ members: JSON.stringify(updatedMembers) })
              .eq('id', org.id)
            
            console.log('Usuario eliminado de la organización')
          }
        }
      } catch (err) {
        console.error(`Error procesando organización ${org.name}:`, err)
      }
    }
    
    // 4. Resetear roles del usuario a account_user
    console.log('\n=== RESETEANDO ROLES DEL USUARIO ===')
    
    const defaultRoles = [
      {
        role: 'account_user',
        status: 'active',
        is_primary: true,
        organization_id: null
      }
    ]
    
    const { error: roleError } = await adminClient
      .from('users')
      .update({ roles: JSON.stringify(defaultRoles) })
      .eq('id', user.id)
    
    if (roleError) {
      console.error('Error reseteando roles:', roleError)
      return
    }
    
    console.log('Roles reseteados a account_user')
    
    // 5. Verificar estado final
    console.log('\n=== ESTADO FINAL ===')
    
    const { data: finalUser } = await adminClient
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single()
    
    console.log('Roles finales:', finalUser.roles)
    
    const { data: finalOrgs } = await adminClient
      .from('organizations')
      .select('id, name, members')
    
    let userInOrgs = 0
    finalOrgs.forEach(org => {
      try {
        const members = typeof org.members === 'string' ? JSON.parse(org.members) : org.members
        if (members.some(m => m.id === user.id)) {
          userInOrgs++
          console.log(`Todavía en: ${org.name}`)
        }
      } catch (err) {
        // Ignorar errores de parseo
      }
    })
    
    console.log(`Total organizaciones donde aún es miembro: ${userInOrgs}`)
    
    if (userInOrgs === 0) {
      console.log('\n¡ÉXITO! Usuario completamente limpiado.')
      console.log('Ahora puedes empezar de cero como un nuevo usuario.')
    } else {
      console.log('\nADVERTENCIA: Aún eres miembro de algunas organizaciones.')
    }
    
  } catch (error) {
    console.error('Error general:', error)
  }
}

// Ejecutar el script
resetUserData()
