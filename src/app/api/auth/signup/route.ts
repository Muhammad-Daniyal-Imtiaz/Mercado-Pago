import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { translateAuthError } from '@/lib/auth-errors'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, full_name } = await request.json()
  const role = 'account_admin'; // Default role for new signups
  const supabase = await createClient()

  // For security, usually we'd restrict who can sign up as sysadmin,
  // but for this implementation we'll allow it if explicitly requested.

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role,
      },
    },
  })

  if (error) {
    return NextResponse.json({ error: translateAuthError(error.message) }, { status: 400 })
  }

  // Create user profile in the database immediately
  if (data.user) {
    const admin = createAdminClient()
    
    // Prepare user data matching the actual table structure
    const now = new Date().toISOString()
    const userData = {
      id: data.user.id,
      email: data.user.email,
      full_name: full_name || data.user.email,
      username: null,
      avatar_url: null,
      phone: null,
      account_id: null,
      invitation_token: null,
      invitation_expires_at: null,
      invited_by: null,
      is_active: true,
      is_verified: false,
      email_confirmed_at: null,
      notification_preferences: JSON.stringify({ sms: false, push: true, email: true, digest: 'instant' }),
      alert_channels: JSON.stringify({ low: ['email'], high: ['email', 'push'], medium: ['email'], critical: ['email', 'push', 'sms'] }),
      last_login_at: null,
      last_active_at: null,
      metadata: JSON.stringify({}),
      created_at: now,
      updated_at: now,
      roles: JSON.stringify([{ organization_id: null, role: role, status: 'active', is_primary: true }])
    }
    
    console.log('Creating user profile with data:', userData)
    
    try {
      const { error: profileError } = await admin
        .from('users')
        .upsert(userData, { onConflict: 'id' })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Return specific error message to client
        return NextResponse.json({ 
          error: 'Error al guardar el perfil: ' + profileError.message,
          code: profileError.code 
        }, { status: 500 })
      }
    } catch (dbError: any) {
      console.error('Database exception:', dbError)
      return NextResponse.json({ 
        error: 'Error de base de datos: ' + (dbError.message || 'Desconocido'),
        exception: dbError.toString()
      }, { status: 500 })
    }
  }

  return NextResponse.json({ user: data.user })
}