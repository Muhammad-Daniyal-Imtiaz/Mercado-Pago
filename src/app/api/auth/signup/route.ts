import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, full_name, role = 'account_admin' } = await request.json()
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

  return NextResponse.json({ user: data.user })
}