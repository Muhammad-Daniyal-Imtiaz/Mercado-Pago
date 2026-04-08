import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, full_name } = await request.json()
  
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
    return NextResponse.json({ error: 'Solo sysadmins pueden crear otros sysadmins' }, { status: 403 })
  }

  // 3. Crear usuario en Auth
  const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirmar email
    user_metadata: {
      full_name,
      role: 'sysadmin'
    }
  })

  if (authCreateError || !authData.user) {
    return NextResponse.json({ 
      error: 'Error al crear usuario: ' + (authCreateError?.message || 'Error desconocido')
    }, { status: 400 })
  }

  // 4. Crear perfil en tabla users con rol sysadmin
  const now = new Date().toISOString()
  const { error: profileError } = await admin
    .from('users')
    .insert({
      id: authData.user.id,
      email: authData.user.email,
      full_name: full_name || email,
      username: null,
      avatar_url: null,
      phone: null,
      account_id: null,
      invitation_token: null,
      invitation_expires_at: null,
      invited_by: null,
      is_active: true,
      is_verified: true,
      email_confirmed_at: now,
      notification_preferences: { sms: false, push: true, email: true, digest: 'instant' },
      alert_channels: { low: ['email'], high: ['email', 'push'], medium: ['email'], critical: ['email', 'push', 'sms'] },
      last_login_at: null,
      last_active_at: null,
      metadata: {},
      created_at: now,
      updated_at: now,
      roles: [{ organization_id: null, role: 'sysadmin', status: 'active', is_primary: true }]
    })

  if (profileError) {
    console.error('Error creating sysadmin profile:', profileError)
    return NextResponse.json({ 
      error: 'Usuario creado en Auth pero error al guardar perfil: ' + profileError.message,
      code: profileError.code 
    }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Sysadmin creado exitosamente',
    user: {
      id: authData.user.id,
      email: authData.user.email,
      full_name
    }
  })
}
