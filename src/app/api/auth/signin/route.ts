import { createClient } from '@/utils/supabase/server'
import { translateAuthError } from '@/lib/auth-errors'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json({ error: translateAuthError(error.message) }, { status: 400 })
  }

  return NextResponse.json({ user: data.user })
}