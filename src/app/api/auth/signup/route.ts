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
    
    // Prepare user data - ensure roles is properly formatted as JSON
    const userData = {
      id: data.user.id,
      email: data.user.email,
      role: role,
      full_name: full_name || data.user.email,
      roles: JSON.stringify([{ organization_id: null, role: role }])
    }
    
    console.log('Creating user profile with data:', userData)
    
    const { error: profileError } = await admin
      .from('users')
      .upsert(userData, { onConflict: 'id' })

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      console.error('Error details:', JSON.stringify(profileError, null, 2))
      // Return the error to the client so we can debug it
      return NextResponse.json({ 
        error: 'Error al guardar el perfil de usuario: ' + profileError.message,
        details: profileError 
      }, { status: 500 })
    }
  }

  return NextResponse.json({ user: data.user })
}