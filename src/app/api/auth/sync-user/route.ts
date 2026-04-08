import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()

  // 1. Get current auth user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !authUser) {
    return NextResponse.json({ error: 'No hay sesión activa' }, { status: 401 })
  }

  // 2. Check if user exists in users table
  const { data: existingProfile } = await admin
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (existingProfile) {
    return NextResponse.json({ 
      message: 'Usuario ya existe en la base de datos',
      user: existingProfile 
    })
  }

  // 3. Create user profile
  const now = new Date().toISOString()
  const role = 'sysadmin' // O 'account_user' si preferís
  
  const userData = {
    id: authUser.id,
    email: authUser.email,
    full_name: authUser.user_metadata?.full_name || authUser.email,
    username: null,
    avatar_url: authUser.user_metadata?.avatar_url || null,
    phone: null,
    account_id: null,
    invitation_token: null,
    invitation_expires_at: null,
    invited_by: null,
    is_active: true,
    is_verified: true,
    email_confirmed_at: authUser.email_confirmed_at || now,
    notification_preferences: { sms: false, push: true, email: true, digest: 'instant' },
    alert_channels: { low: ['email'], high: ['email', 'push'], medium: ['email'], critical: ['email', 'push', 'sms'] },
    last_login_at: now,
    last_active_at: now,
    metadata: { provider: 'google' },
    created_at: now,
    updated_at: now,
    roles: [{ organization_id: null, role: role, status: 'active', is_primary: true }]
  }

  const { error: upsertError } = await admin
    .from('users')
    .upsert(userData, { onConflict: 'id' })

  if (upsertError) {
    console.error('Sync error:', upsertError)
    return NextResponse.json({ 
      error: 'Error al sincronizar: ' + upsertError.message,
      code: upsertError.code,
      details: upsertError
    }, { status: 500 })
  }

  // 4. Verify creation
  const { data: newProfile } = await admin
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  return NextResponse.json({ 
    success: true, 
    message: 'Usuario sincronizado exitosamente',
    user: newProfile
  })
}
