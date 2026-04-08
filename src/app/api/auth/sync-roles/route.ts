import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { syncUserRoles, checkRoleConsistency } from '@/lib/role-sync'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. Verificar consistencia de roles
    const isConsistent = await checkRoleConsistency(user.id)
    
    if (isConsistent) {
      return NextResponse.json({ 
        success: true, 
        message: 'Roles are already consistent',
        synced: false
      })
    }

    // 3. Sincronizar roles
    const synced = await syncUserRoles(user.id)
    
    if (!synced) {
      return NextResponse.json({ 
        error: 'Failed to sync roles' 
      }, { status: 500 })
    }

    // 4. Obtener datos actualizados
    const { data: updatedUser } = await adminClient
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ 
      success: true, 
      message: 'Roles synchronized successfully',
      synced: true,
      roles: updatedUser?.roles
    })

  } catch (error) {
    console.error('Error in role sync:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
