import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
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
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Create user profile in the database immediately
  if (data.user) {
    const admin = createAdminClient()
    const { error: profileError } = await admin
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email,
        role: role,
        full_name: full_name || data.user.email,
        roles: [{ organization_id: null, role: role }]
      })

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      // Don't fail the signup, just log the error
    }
  }

  return NextResponse.json({ user: data.user })
}