import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { user_id } = await request.json()
  
  const supabase = await createClient()
  const admin = createAdminClient()

  // 1. Verificar que el usuario actual sea sysadmin
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // 2. Verificar que el usuario actual tenga rol sysadmin
  const { data: currentUserData } = await admin
    .from('users')
    .select('roles')
    .eq('id', currentUser.id)
    .single()

  const roles = typeof currentUserData?.roles === 'string' 
    ? JSON.parse(currentUserData.roles) 
    : (currentUserData?.roles || [])
  
  const isSysadmin = roles.some((r: any) => r.role === 'sysadmin')
  
  if (!isSysadmin) {
    return NextResponse.json({ error: 'Solo sysadmins pueden promover otros usuarios' }, { status: 403 })
  }

  // 3. Obtener el usuario objetivo
  const { data: targetUser, error: targetError } = await admin
    .from('users')
    .select('*')
    .eq('id', user_id)
    .single()

  if (targetError || !targetUser) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  // 4. Parsear roles actuales y agregar sysadmin
  let userRoles = []
  try {
    userRoles = typeof targetUser.roles === 'string' 
      ? JSON.parse(targetUser.roles) 
      : (targetUser.roles || [])
  } catch {
    userRoles = []
  }

  // Verificar si ya es sysadmin
  const alreadySysadmin = userRoles.some((r: any) => r.role === 'sysadmin')
  if (alreadySysadmin) {
    return NextResponse.json({ error: 'El usuario ya es sysadmin' }, { status: 400 })
  }

  // Agregar rol sysadmin (sin organization)
  userRoles.push({
    organization_id: null,
    role: 'sysadmin',
    status: 'active',
    is_primary: true
  })

  // 5. Actualizar el usuario
  const { error: updateError } = await admin
    .from('users')
    .update({
      roles: userRoles,
      updated_at: new Date().toISOString()
    })
    .eq('id', user_id)

  if (updateError) {
    console.error('Error promoting to sysadmin:', updateError)
    return NextResponse.json({ 
      error: 'Error al actualizar rol: ' + updateError.message 
    }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Usuario promovido a sysadmin exitosamente',
    user: {
      id: targetUser.id,
      email: targetUser.email,
      full_name: targetUser.full_name
    }
  })
}

// GET: Listar todos los usuarios
export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()

  // 1. Verificar que el usuario actual sea sysadmin
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // 2. Verificar que el usuario actual tenga rol sysadmin
  const { data: currentUserData } = await admin
    .from('users')
    .select('roles')
    .eq('id', currentUser.id)
    .single()

  const roles = typeof currentUserData?.roles === 'string' 
    ? JSON.parse(currentUserData.roles) 
    : (currentUserData?.roles || [])
  
  const isSysadmin = roles.some((r: any) => r.role === 'sysadmin')
  
  if (!isSysadmin) {
    return NextResponse.json({ error: 'Solo sysadmins pueden ver todos los usuarios' }, { status: 403 })
  }

  // 3. Listar todos los usuarios
  const { data: users, error: usersError } = await admin
    .from('users')
    .select('id, email, full_name, is_active, is_verified, created_at, roles')
    .order('created_at', { ascending: false })

  if (usersError) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }

  // Parsear roles para cada usuario
  const parsedUsers = users.map((u: any) => {
    let userRoles = []
    try {
      userRoles = typeof u.roles === 'string' ? JSON.parse(u.roles) : (u.roles || [])
    } catch {
      userRoles = []
    }
    const isSysadmin = userRoles.some((r: any) => r.role === 'sysadmin')
    // Get primary role (first active non-sysadmin role, or sysadmin if that's the only one)
    const primaryRole = isSysadmin 
      ? 'sysadmin'
      : (userRoles.find((r: any) => r.status !== 'removed')?.role || 'account_user')
    return {
      ...u,
      is_sysadmin: isSysadmin,
      role: primaryRole
    }
  })

  return NextResponse.json({ users: parsedUsers })
}
